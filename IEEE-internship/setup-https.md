# Install mkcert (run this once)
# For Windows (using Chocolatey):
# choco install mkcert

# Or download from: https://github.com/FiloSottile/mkcert/releases

# After installing mkcert, run these commands in your project root:
mkcert -install
mkcert localhost 127.0.0.1 ::1

# This will create:
# localhost.pem (certificate)
# localhost-key.pem (private key)

# Then update vite.config.ts to use these certificates
