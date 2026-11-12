# Sealed updates (no hosting needed)

The update repo is public, so anyone could download the whole product. Instead of running a service that checks licenses, the zip itself is locked with a key that only real copies of the engine hold. A stranger gets a file that will not open. `seal.py` is the lock, `test_seal.py` its checks (run on the real 0.5.0 zip: 0.04 s to seal or open).

What it protects against: someone who does not own a copy downloading the product. What it does not do: stop someone who already owns a copy (they have the key inside their engine, and they already have the product). The license check in the engine still decides who can run it.

## Putting it in (source copy)

1. `python3 seal.py newkey update.key` once. Keep `update.key` out of every repo, zip and chat.
2. Copy `seal.py` to `engine/_seal.py`. Add `engine/_updatekey.py` holding the 32 bytes, built from `update.key` when the engine is compiled. Add both to the updater's allowlist.
3. `engine/upgrade.py`: after the signature and fingerprint checks pass (they now run on the sealed file), `if is_sealed(blob): blob = unseal(blob, KEY)`, then carry on as today. A plain zip still works, which is what makes the move possible.
4. `./reel package` (the update part): seal the zip, and put the sealed file's name, size and sha256 in the signed note.

## Moving every copy over

1. Release 0.5.1 the old way (a plain zip). It carries the key and the unseal step, and its signed note names a NEW repo as the address for later updates.
2. From 0.6.0 on, publish only sealed zips, only in the new repo.
3. A few weeks later, make the old repo private or delete it. Its history holds every plain zip, so emptying the branch is not enough.
4. A copy that never took 0.5.1 keeps working and can be updated by hand with `./reel upgrade --from`.
