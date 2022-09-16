# update-service
A simple service to host and describe OTA update files.

## Build folder structure
```
builds/
├── <ota_name>/
│   ├── <short_hash>.<branch>.bin
│   ├── abcd1ef.master.bin
│   ├── fe1dcba.master.bin
│   ├── 3242343.foo.bin
│   ├── master.latest.bin
│   ├── foo.latest.bin
│   └── latest.bin
├── user1/
│   ├── <short_hash>.<branch>.bin
│   └── ...
├── user2/
│   ├── <short_hash>.<branch>.bin
│   └── ...
└── ...
```

There are some special files:
- `<branch>.latest.bin`: Symlink to the latest build for the given branch
- `latest.bin`: Symlink to the latest build uploaded by the CI

---

This is used with https://github.com/bobbycar-graz/bobby-scraper to manage and serve OTA updates for the [bobbycar firmware](https://github.com/bobbycar-graz/bobbycar-boardcomputer-firmware/).