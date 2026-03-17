#Requires -Version 5.0
param()

fnm env --use-on-cd | Out-String | Invoke-Expression
fnm use --install-if-missing 20
npm run build
