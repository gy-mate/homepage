# Useful Commands

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
node-hp-scan-to adf-autoscan --address <local_ip_address> --width 2450 --height 3475 --directory <output_folder>
```

## Python

### Upgrading venv Versions

Delete then recreate the venv.

## Images

### WebP

#### Keep Color Profile

To keep all metadata, including rotation and the embedded color profile, run:

```sh
cwebp -metadata all input.jpeg -o output.webp
```

## Networking

### Ports

#### Free Up Ports

To check what's using a TCP port, run:

```sh
lsof -t -i tcp:<port>
```

In order to free up that port, kill the process using it by running:

```sh
kill -9 <PID>
```
