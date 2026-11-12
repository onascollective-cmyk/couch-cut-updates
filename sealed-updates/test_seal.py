"""Checks for seal.py. Run: python3 test_seal.py [a real update zip]"""
import hashlib, io, os, sys, time, zipfile
from seal import seal, unseal, is_sealed, SealError

key, other = os.urandom(32), os.urandom(32)
data = open(sys.argv[1], "rb").read() if len(sys.argv) > 1 else os.urandom(3_800_000)
t = time.time(); blob = seal(data, key); t_seal = time.time() - t
t = time.time(); back = unseal(blob, key); t_open = time.time() - t
assert back == data, "round trip"
assert is_sealed(blob) and not is_sealed(data)
assert seal(data, key) != blob, "two seals of the same file must differ"
assert unseal(seal(b"", key), key) == b""
def refused(b, k):
    try: unseal(b, k)
    except SealError: return True
    return False
assert refused(blob, other), "wrong key"
flipped = bytearray(blob); flipped[len(blob) // 2] ^= 1
assert refused(bytes(flipped), key), "one changed bit"
assert refused(blob[:-1], key) and refused(blob[:20], key) and refused(data, key), "cut short or not sealed"
try: seal(data, b"short"); raise AssertionError("short key accepted")
except SealError: pass
readable = True
try: zipfile.ZipFile(io.BytesIO(blob)).namelist()
except zipfile.BadZipFile: readable = False
assert not readable, "a sealed file must not open as a zip"
assert b"CLAUDE.md" not in blob and b"engine/" not in blob, "no file names may show"
print(f"all checks pass  ({len(data):,} bytes, seal {t_seal:.2f} s, open {t_open:.2f} s)")
