[Setup]
AppName=Minimal Tkinter App
AppVersion=1.0
DefaultDirName={pf}\MinimalTkApp
DefaultGroupName=Minimal Tkinter App
OutputBaseFilename=MinimalTkApp_Installer
Compression=lzma
SolidCompression=yes

[Files]
Source: "dist\\main.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\Minimal Tkinter App"; Filename: "{app}\main.exe"
Name: "{commondesktop}\Minimal Tkinter App"; Filename: "{app}\main.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop icon"; GroupDescription: "Additional icons:"; Flags: unchecked

[Run]
Filename: "{app}\main.exe"; Description: "Launch Minimal Tkinter App"; Flags: nowait postinstall skipifsilent

; Notes:
; - To build this installer you need Inno Setup (https://jrsoftware.org/isinfo.php).
; - Compile with: "C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe" installer.iss
; - If you want a custom icon, add an .ico to this folder and set the IconFilename directive in [Setup] or add an 'IconFile' flag to [Files]/[Icons].
