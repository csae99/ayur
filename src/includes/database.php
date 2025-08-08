<?php
    $hostname = 'mariadb-db';
    $username = 'root';
    $password = 'root';
    $dbname = 'herbs';

    $conn = mysqli_connect($hostname,$username,$password,$dbname);
    if(!$conn){
        echo 'Error connecting to database'.mysqli_connect_errno();    
        exit();
    }
?>
