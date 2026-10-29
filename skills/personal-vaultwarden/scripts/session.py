#!/usr/bin/env python3
"""Check or unlock the local Archie vault without emitting credentials."""
import argparse
import json
import os
from pathlib import Path
import stat
import subprocess
import tempfile

ENDPOINT = 'https://archie.tail156535.ts.net:8443'
SESSION = Path.home() / '.local/state/bitwarden-mcp/session'


class VaultError(Exception):
    pass


def private_file(path):
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    try:
        info = os.fstat(fd)
        if not stat.S_ISREG(info.st_mode) or info.st_uid != os.getuid() or stat.S_IMODE(info.st_mode) != 0o600:
            raise VaultError('Expected an owned, regular 0600 secret file.')
        if info.st_size > 8192:
            raise VaultError('Secret file exceeds the expected size.')
        return fd
    except BaseException:
        os.close(fd)
        raise


def private_directory(path, create=False):
    if create:
        path.mkdir(mode=0o700, parents=True, exist_ok=True)
    info = path.lstat()
    if not stat.S_ISDIR(info.st_mode) or info.st_uid != os.getuid() or stat.S_IMODE(info.st_mode) != 0o700:
        raise VaultError('Session directory must be owned, non-symlink, and mode 0700.')


def token_value(value):
    value = value.strip()
    if not value or len(value) > 8192 or any(c.isspace() for c in value):
        raise VaultError('Invalid session format; request a fresh private unlock.')
    return value


def session_env():
    env = os.environ.copy()
    if env.get('BW_SESSION'):
        env['BW_SESSION'] = token_value(env['BW_SESSION'])
        return env, 'environment'
    try:
        private_directory(SESSION.parent)
        fd = private_file(SESSION)
    except FileNotFoundError:
        return env, 'none'
    with os.fdopen(fd) as stream:
        env['BW_SESSION'] = token_value(stream.read(8193))
    return env, 'local-file'


def run_bw(args, env):
    try:
        result = subprocess.run(
            [env.get('BW_CLI_PATH') or 'bw', *args], env=env,
            stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
            stderr=subprocess.PIPE, text=True, timeout=60, check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        raise VaultError('Bitwarden command unavailable or timed out.') from None
    if result.returncode:
        raise VaultError('Bitwarden command failed. Check connectivity and authentication privately.')
    return result.stdout


def vault_status(env):
    try:
        data = json.loads(run_bw(['status'], env))
    except (ValueError, TypeError):
        raise VaultError('Invalid Bitwarden status response.') from None
    if not isinstance(data, dict) or data.get('status') not in ('unauthenticated', 'locked', 'unlocked'):
        raise VaultError('Unknown Bitwarden status; stopped without changing configuration.')
    if str(data.get('serverUrl', '')).rstrip('/') != ENDPOINT:
        raise VaultError('CLI points at another vault; preserve it and resolve the account first.')
    return data['status']


def unlock(password_file):
    temporary = None
    try:
        fd = private_file(password_file)
        os.close(fd)
        env = os.environ.copy()
        env.pop('BW_SESSION', None)
        if vault_status(env) == 'unauthenticated':
            raise VaultError('This machine needs login before unlock; see authentication.md.')
        token = token_value(run_bw(['unlock', '--passwordfile', str(password_file), '--raw'], env))
        env['BW_SESSION'] = token
        if vault_status(env) != 'unlocked':
            raise VaultError('New session did not unlock the expected vault.')
        private_directory(SESSION.parent, create=True)
        fd, temporary = tempfile.mkstemp(prefix='.session-', dir=SESSION.parent)
        with os.fdopen(fd, 'w') as stream:
            os.fchmod(stream.fileno(), 0o600)
            stream.write(token)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, SESSION)
        temporary = None
        return {'status': 'unlocked', 'sessionSource': 'local-file', 'mcpReconnectRequired': True}
    finally:
        try:
            if temporary is not None:
                Path(temporary).unlink(missing_ok=True)
        finally:
            password_file.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    commands.add_parser('status')
    command = commands.add_parser('unlock')
    command.add_argument('--password-file', type=Path, required=True,
                         help='One-use private file; deleted on success or failure.')
    args = parser.parse_args()
    try:
        if args.command == 'unlock':
            result = unlock(args.password_file)
        else:
            env, source = session_env()
            result = {'status': vault_status(env), 'sessionSource': source}
        print(json.dumps(result))
    except VaultError as error:
        # VaultError messages are fixed strings; raw CLI output never enters them.
        print(json.dumps({'error': str(error)}))
        raise SystemExit(1)
    except (OSError, ValueError):
        print(json.dumps({'error': 'Private file operation failed. Verify permissions and cleanup without dumping contents.'}))
        raise SystemExit(1)


if __name__ == '__main__':
    main()
