# Minimal Tkinter Desktop App

This is a minimal, free (built-in) Python desktop app using `tkinter`.

Run (Windows):

```powershell
python main.py
```

Headless smoke test (verifies `tkinter` is importable):

```powershell
python test_run.py
```

Packaging to single Windows executable (optional):

```powershell
pip install pyinstaller
pyinstaller --onefile main.py
```

Windows helper script:

Run the included `build.ps1` to create a virtualenv, install `pyinstaller`, and build a single-file EXE:

```powershell
./build.ps1
# or to clean and rebuild:
./build.ps1 -Rebuild
```

Notes:
- Ensure Python 3.8+ is installed and `python` is on your PATH before running the script.
- The built executable will be at `dist\main.exe`.

Creating a Windows installer (Inno Setup)

1) Install Inno Setup: https://jrsoftware.org/

2) Build the installer from the project folder (where `installer.iss` is):

```powershell
# Example path to Inno's compiler; adjust if installed elsewhere
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" installer.iss
```

3) The installer output filename is controlled by `OutputBaseFilename` in `installer.iss` (default: `MinimalTkApp_Installer.exe`).

Notes:
- Place a custom `app_icon.ico` in the project folder and update `installer.iss` or `icon-placeholder.txt` if you want a branded icon.
- You can use `SignTool.exe` or a third-party service to code-sign the installer; code signing is optional but recommended for distribution.

