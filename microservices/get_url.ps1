$logs = docker logs microservices-notification-service-1 2>&1 | Out-String
if ($logs -match '(https://ethereal.email/\S+)') {
    Write-Output $matches[1]
}
