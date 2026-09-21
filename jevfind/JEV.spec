# PyInstaller spec for the JEV desktop app. Works on macOS and Windows.
#   Build with:  pyinstaller --noconfirm JEV.spec
# (the Build JEV scripts do this for you inside a clean virtual environment).

import sys
from PyInstaller.utils.hooks import collect_submodules

# Only bundle optional readers that are actually installed in the build env.
hidden = []
for _m in ["pypdf", "docx", "openpyxl", "pptx", "striprtf"]:
    try:
        __import__(_m)
        hidden.append(_m)
    except Exception:
        pass
if "pypdf" in hidden:
    hidden += collect_submodules("pypdf")

if sys.platform == "darwin":
    icon = "assets/JEV.icns"
elif sys.platform.startswith("win"):
    icon = "assets/JEV.ico"
else:
    icon = None

datas = [
    ("assets/icon.png", "assets"),
    ("assets/JEV.icns", "assets"),
    ("assets/JEV.ico", "assets"),
]

a = Analysis(
    ["jev_app.py"],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=hidden,
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="JEV",
    debug=False,
    strip=False,
    upx=True,
    console=False,          # windowed / no terminal
    icon=icon,
)

coll = COLLECT(exe, a.binaries, a.datas, strip=False, upx=True, name="JEV")

if sys.platform == "darwin":
    app = BUNDLE(
        coll,
        name="JEV.app",
        icon=icon,
        bundle_identifier="ai.typesafe.jev",
        info_plist={
            "CFBundleName": "JEV",
            "CFBundleDisplayName": "JEV",
            "NSHighResolutionCapable": True,
        },
    )
