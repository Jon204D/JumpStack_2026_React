output "frontend_instance_public_ip" {
  value = aws_instance.app.public_ip
}

output "frontend_ssh_command" {
  value = "ssh -i ssh-keys/${var.student_name}-key.pem ubuntu@${aws_instance.app.public_ip}"
}

output "frontend_url" {
  value = "http://${aws_instance.app.public_ip}"
}

output "frontend_nextjs_url" {
  value = "http://${aws_instance.app.public_ip}:3000"
}