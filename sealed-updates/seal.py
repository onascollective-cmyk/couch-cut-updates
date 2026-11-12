"""Sealed updates: the update zip is locked with a key that only real copies of the engine hold.

Why: the update repo is public, so anyone could download the whole product. A sealed zip is noise to a stranger.
A copy that already has the engine can open it, and nothing has to be hosted anywhere.

Only Python's own library is used (no new tools to install). The lock is a SHAKE-256 keystream with an HMAC-SHA256
seal over the whole file, so a file that was changed, cut short or locked with another key is refused before
anything is unpacked. The maker's signature and fingerprint checks stay exactly as they are, on the SEALED file.

File layout: b"CCUT1" + 16 random bytes + 32 byte seal + the locked zip.

The key is 32 random bytes. It lives in the maker's source copy and inside the compiled engine. It is never put
in the update repo. Anyone who already has a copy could dig it out, but they already have the product.

Maker:   python3 seal.py newkey update.key
         python3 seal.py seal the-couch-cut-update-0.6.0.zip the-couch-cut-update-0.6.0.sealed update.key
Engine:  data = unseal(blob, KEY)   (in engine/upgrade.py, after the signature and fingerprint checks pass)
"""
from __future__ import annotations

import hashlib
import hmac
import os
import sys

MAGIC = b"CCUT1"
NONCE = 16
TAG = 32


class SealError(Exception):
    pass


def _keys(key: bytes) -> tuple[bytes, bytes]:
    if len(key) != 32:
        raise SealError("The update key must be 32 bytes.")
    return hashlib.sha256(b"couch-cut-update|lock|" + key).digest(), hashlib.sha256(b"couch-cut-update|seal|" + key).digest()


def _xor(data: bytes, lock: bytes, nonce: bytes) -> bytes:
    stream = hashlib.shake_256(lock + nonce).digest(len(data))
    return (int.from_bytes(data, "big") ^ int.from_bytes(stream, "big")).to_bytes(len(data), "big") if data else b""


def seal(data: bytes, key: bytes) -> bytes:
    lock, mac = _keys(key)
    nonce = os.urandom(NONCE)
    body = _xor(data, lock, nonce)
    tag = hmac.new(mac, MAGIC + nonce + body, hashlib.sha256).digest()
    return MAGIC + nonce + tag + body


def is_sealed(blob: bytes) -> bool:
    return blob[: len(MAGIC)] == MAGIC


def unseal(blob: bytes, key: bytes) -> bytes:
    lock, mac = _keys(key)
    head = len(MAGIC) + NONCE + TAG
    if not is_sealed(blob) or len(blob) < head:
        raise SealError("This is not a sealed Couch Cut update.")
    nonce, tag, body = blob[len(MAGIC) : len(MAGIC) + NONCE], blob[len(MAGIC) + NONCE : head], blob[head:]
    if not hmac.compare_digest(tag, hmac.new(mac, MAGIC + nonce + body, hashlib.sha256).digest()):
        raise SealError("This update was changed or is not for this copy, so I won't open it.")
    return _xor(body, lock, nonce)


def main(argv: list[str]) -> int:
    if len(argv) == 3 and argv[1] == "newkey":
        if os.path.exists(argv[2]):
            print(f"{argv[2]} is already there. I never replace a key.")
            return 1
        with open(argv[2], "wb") as f:
            f.write(os.urandom(32))
        os.chmod(argv[2], 0o600)
        print(f"New key in {argv[2]}. Keep it out of every repo and zip.")
        return 0
    if len(argv) == 5 and argv[1] in ("seal", "unseal"):
        key = open(argv[4], "rb").read()
        data = open(argv[2], "rb").read()
        if os.path.exists(argv[3]):
            print(f"{argv[3]} is already there. I never replace a file.")
            return 1
        out = seal(data, key) if argv[1] == "seal" else unseal(data, key)
        with open(argv[3], "wb") as f:
            f.write(out)
        print(f"{argv[3]}  {len(out)} bytes  sha256 {hashlib.sha256(out).hexdigest()}")
        return 0
    print(__doc__)
    return 2


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv))
    except SealError as e:
        print(e)
        sys.exit(1)
