"""Exercise private unlock and cleanup using only fake credentials and a fake CLI."""
import json
import os
from pathlib import Path
import subprocess
import tempfile

SCRIPT = Path('skills/personal-vaultwarden/scripts/session.py').resolve()
FAKE_PASSWORD = 'fake-master-do-not-print'
FAKE_TOKEN = 'fake-session-do-not-print'

with tempfile.TemporaryDirectory() as folder:
    home = Path(folder)
    fake = home / 'bw'
    fake.write_text('''#!/usr/bin/env python3
import json, os, pathlib, sys
state = json.loads(pathlib.Path(os.environ['FAKE_STATE']).read_text())
if sys.argv[1:] == ['status']:
    status = state['status']
    if status == 'locked' and os.environ.get('BW_SESSION') == 'fake-session-do-not-print':
        status = 'unlocked'
    print(json.dumps({'status':status,'serverUrl':state['serverUrl'],'userEmail':'never-emit@example.test'}))
elif sys.argv[1] == 'unlock':
    assert sys.argv[2] == '--passwordfile' and sys.argv[4] == '--raw'
    assert pathlib.Path(sys.argv[3]).read_text() == 'fake-master-do-not-print'
    if state.get('fail'):
        print('fake-master-do-not-print fake-session-do-not-print',file=sys.stderr)
        sys.exit(1)
    print('fake-session-do-not-print')
else:
    sys.exit(3)
''')
    fake.chmod(0o700)
    state = home / 'state.json'
    secret = home / 'one-use-password'
    session = home / '.local/state/bitwarden-mcp/session'
    env = dict(os.environ, HOME=str(home), BW_CLI_PATH=str(fake), FAKE_STATE=str(state))
    env.pop('BW_SESSION', None)

    def call(args, expected=0, override=None):
        result = subprocess.run(['python3', str(SCRIPT), *args], env=override or env,
                                capture_output=True, text=True)
        assert result.returncode == expected, result.stdout + result.stderr
        for value in (FAKE_PASSWORD, FAKE_TOKEN, 'never-emit@example.test'):
            assert value not in result.stdout + result.stderr
        assert not result.stderr
        return json.loads(result.stdout)

    def set_state(status='locked', server='https://archie.tail156535.ts.net:8443', **extra):
        state.write_text(json.dumps(dict(status=status, serverUrl=server, **extra)))

    def password():
        secret.write_text(FAKE_PASSWORD)
        secret.chmod(0o600)

    set_state()
    assert call(['status']) == {'status':'locked','sessionSource':'none'}
    password()
    assert call(['unlock','--password-file',str(secret)])['status'] == 'unlocked'
    assert not secret.exists() and session.read_text() == FAKE_TOKEN
    assert session.stat().st_mode & 0o777 == 0o600
    assert session.parent.stat().st_mode & 0o777 == 0o700
    assert not list(session.parent.glob('.session-*'))
    assert call(['status']) == {'status':'unlocked','sessionSource':'local-file'}
    print('PASS secure unlock, atomic session, effective status, private modes, cleanup, no secret output')

    stale = dict(env, BW_SESSION='stale-fake-token')
    assert call(['status'], override=stale) == {'status':'locked','sessionSource':'environment'}
    print('PASS inherited token precedence is visible without printing tokens')

    for status, server, extra in [
        ('locked','https://archie.tail156535.ts.net:8443',{'fail':True}),
        ('unauthenticated','https://archie.tail156535.ts.net:8443',{}),
        ('locked','https://other.example',{}),
        ('unknown','https://archie.tail156535.ts.net:8443',{}),
    ]:
        set_state(status, server, **extra)
        password()
        call(['unlock','--password-file',str(secret)],expected=1)
        assert not secret.exists() and session.read_text() == FAKE_TOKEN
        assert not list(session.parent.glob('.session-*'))
    print('PASS failed unlock, logged-out vault, wrong server and unknown state preserve session and delete password')

    set_state()
    session.chmod(0o644)
    call(['status'],expected=1)
    session.unlink()
    elsewhere = home/'elsewhere'; elsewhere.write_text(FAKE_TOKEN); elsewhere.chmod(0o600)
    session.symlink_to(elsewhere)
    call(['status'],expected=1)
    print('PASS unsafe session permissions and symlinks rejected')
