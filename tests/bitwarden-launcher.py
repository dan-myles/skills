import json,os,pathlib,subprocess,tempfile
launcher=str(pathlib.Path('files/bitwarden/launcher.mjs').resolve())
with tempfile.TemporaryDirectory() as d:
 p=pathlib.Path(d); bin=p/'bin';bin.mkdir()
 bw=bin/'bw'
 bw.write_text('''#!/usr/bin/env python3
import os,json,pathlib,sys
p=pathlib.Path(os.environ['FAKE_STATE']);s=json.loads(p.read_text())
if sys.argv[1:]==['status']: print(json.dumps(s))
elif sys.argv[1:3]==['config','server']:
 s['serverUrl']=sys.argv[3];p.write_text(json.dumps(s));(p.parent/'changed').touch()
else:sys.exit(2)
''');bw.chmod(0o755)
 m=bin/'mcp-server-bitwarden';m.write_text('#!/usr/bin/env python3\nimport os,json\nprint(json.dumps({k:os.environ.get(k) for k in ["BW_API_BASE_URL","BW_IDENTITY_URL","BW_SESSION"]}))\n');m.chmod(0o755)
 env=dict(os.environ,PATH=str(bin)+':'+os.environ['PATH'],HOME=d,FAKE_STATE=str(p/'state'))
 env.pop('BW_SESSION',None);env.pop('BW_CLI_PATH',None)
 target='https://archie.tail156535.ts.net:8443'
 def run(state,mode='configure'):
  (p/'state').write_text(json.dumps(state));(p/'changed').unlink(missing_ok=True)
  return subprocess.run(['node',launcher,mode],env=env,text=True,capture_output=True)
 for state in ['unauthenticated','locked','unlocked']:
  r=run({'status':state,'serverUrl':target});assert r.returncode==0,r.stderr;assert not (p/'changed').exists()
 print('PASS matching endpoint preserves all auth states')
 for state in ['locked','unlocked','unknown']:
  r=run({'status':state,'serverUrl':'https://other.example'},'mcp');assert r.returncode!=0;assert not (p/'changed').exists();assert not r.stdout
 print('PASS authenticated other vault and unknown status fail closed')
 r=run({'status':'unauthenticated','serverUrl':'https://other.example'});assert r.returncode==0 and (p/'changed').exists()
 print('PASS unauthenticated vault configured once')
 r=run({'status':'unauthenticated','serverUrl':target},'mcp');assert r.returncode==0,r.stderr
 data=json.loads(r.stdout);assert data['BW_SESSION'] is None and data['BW_API_BASE_URL']==target+'/api' and data['BW_IDENTITY_URL']==target+'/identity'
 print('PASS logged-out MCP starts without token, correct endpoints, clean stdout')
 secret=p/'.local/state/bitwarden-mcp/session';secret.parent.mkdir(parents=True);secret.write_text('fake-test-session');secret.chmod(0o600)
 r=run({'status':'locked','serverUrl':target},'mcp');assert json.loads(r.stdout)['BW_SESSION']=='fake-test-session'
 secret.chmod(0o644);r=run({'status':'locked','serverUrl':target},'mcp');assert r.returncode!=0 and not r.stdout
 secret.unlink();secret.symlink_to(p/'state');r=run({'status':'locked','serverUrl':target},'mcp');assert r.returncode!=0 and not r.stdout
 print('PASS private local session accepted; loose permissions and symlink refused')
