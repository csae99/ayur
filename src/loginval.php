<?php 
ob_start(); // start output buffering (prevents headers already sent)
session_start();
require('includes/database.php');

if(isset($_POST['login'])){
    $uname = mysqli_real_escape_string($conn,$_POST['username']);
    $pass = mysqli_real_escape_string($conn,$_POST['password']);
    $password = md5($pass);

    // Patient
    $sql = "SELECT * FROM `patients` WHERE `username`='$uname' AND `password`='$password'";
    $query = mysqli_query($conn,$sql);
    if(mysqli_num_rows($query) == 1){
        $_SESSION['patient'] = $uname;
        header('Location: patients/');
        exit();
    }

    // Practitioner
    $sql = "SELECT * FROM `practitioner` WHERE `username`='$uname' AND `password`='$password'";
    $query = mysqli_query($conn,$sql);
    if(mysqli_num_rows($query) == 1){
        $_SESSION['user'] = $uname;
        header('Location: practitioners/');
        exit();
    }

    // Admin
    $sql = "SELECT * FROM `admin` WHERE `username`='$uname' AND `password`='$password'";
    $query = mysqli_query($conn,$sql);
    if(mysqli_num_rows($query) == 1){
        $_SESSION['admin'] = $uname;
        header('Location: admin/admin.php');
        exit();
    }

    // Invalid
    header('Location: login.php?error=Invalid Username or password');
    exit();
}
?>
