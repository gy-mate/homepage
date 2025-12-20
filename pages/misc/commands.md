# Useful Commands

## Images

### WebP

#### Keep Color Profile

To keep all metadata, including rotation and the embedded color profile, run:

```sh
cwebp -metadata all input.jpeg -o output.webp
```

## Docker

### Freeing up space

1. Start all used containers
2. Run:
    ```sh
    docker system prune --force
    ```

## Printer

### Scanning

```sh
pnpm install -g node-hp-scan-to
```

Auto-scan an A4 paper from the ADF:

```sh
node-hp-scan-to adf-autoscan --address <local_ip_address> --width 2450 --height 3525 --directory <output_folder>
```
