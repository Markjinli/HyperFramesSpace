Set sh = CreateObject("Wscript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
sh.CurrentDirectory = dir
exe = dir & "\node_modules\electron\dist\electron.exe"
If Not fso.FileExists(exe) Then
  sh.Run "cmd /c cd /d """ & dir & """ && npm install --no-fund --no-audit", 1, True
End If
sh.Run """" & exe & """ """ & dir & """", 0, False