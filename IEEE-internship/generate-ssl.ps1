# Generate SSL certificates for local HTTPS development
# This allows camera access in browsers

# Install mkcert if not already installed
# On Windows: choco install mkcert (requires Chocolatey)
# On macOS: brew install mkcert
# On Linux: Follow mkcert installation instructions

Write-Host "Generating SSL certificates for localhost..."
Write-Host "This requires mkcert to be installed."
Write-Host ""
Write-Host "Install mkcert:"
Write-Host "Windows: choco install mkcert"
Write-Host "macOS: brew install mkcert"
Write-Host "Linux: See mkcert documentation"
Write-Host ""

if (Get-Command mkcert -ErrorAction SilentlyContinue) {
    # Create local CA
    mkcert -install
    
    # Generate certificates for localhost
    mkcert localhost 127.0.0.1 ::1
    
    Write-Host "SSL certificates generated successfully!"
    Write-Host "Now you can run 'npm run dev' with HTTPS enabled."
} else {
    Write-Host "mkcert not found. Please install mkcert first."
    Write-Host ""
    Write-Host "Alternative: The app will still work without HTTPS on localhost,"
    Write-Host "but camera access will be limited."
}
