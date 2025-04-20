<?php 
ob_start();
session_start();

$connection = mysqli_connect("mariadb_db", "root", "root", "herbs");
if (!$connection) {
    die("Connection failed: " . mysqli_connect_error());
}

function post_redirect($url)
{
    header('Location: ' . $url);
    ob_end_flush();
    die();
}

function get_redirect($url)
{
    echo "<script>window.location.href = '" . $url . "';</script>";
}

function query($query)
{
    global $connection;
    $run = mysqli_query($connection, $query);
    if ($run) {
        while ($row = $run->fetch_assoc()) {
            $data[] = $row;
        }
        return !empty($data) ? $data : "";
    } else {
        return 0;
    }
}

function single_query($query)
{
    global $connection;
    if (mysqli_query($connection, $query)) {
        return "done";
    } else {
        die("Query failed: " . mysqli_error($connection));
    }
}

function login()
{
    if (isset($_POST['login'])) {
        $userEmail = trim(strtolower($_POST['userEmail']));
        $password = trim($_POST['password']);
        if (empty($userEmail) || empty($password)) {
            $_SESSION['message'] = "empty_err";
            post_redirect("login.php");
        }

        $query = "SELECT email, user_id, user_password FROM user WHERE email= '$userEmail'";
        $data = query($query);

        if (empty($data)) {
            $_SESSION['message'] = "loginErr";
            post_redirect("login.php");
        } elseif ($password == $data[0]['user_password'] && $userEmail == $data[0]['email']) {
            $_SESSION['user_id'] = $data[0]['user_id'];
            post_redirect("index.php");
        } else {
            $_SESSION['message'] = "loginErr";
            post_redirect("login.php");
        }
    }
}

function singUp()
{
    if (isset($_POST['singUp'])) {
        $email  = trim(strtolower($_POST['email']));
        $fname  = trim($_POST['Fname']);
        $lname = trim($_POST['Lname']);
        $address = trim($_POST['address']);
        $passwd = trim($_POST['passwd']);

        if (empty($email) || empty($passwd) || empty($address) || empty($fname) || empty($lname)) {
            $_SESSION['message'] = "empty_err";
            post_redirect("signUp.php");
        } elseif (!preg_match("/^([a-z0-9\+_\-]+)(\.[a-z0-9\+_\-]+)*@([a-z0-9\-]+\.)+[a-z]{2,6}$/ix", $email)) {
            $_SESSION['message'] = "signup_err_email";
            post_redirect("signUp.php");
        } elseif (!preg_match('/^(?=.*\d)(?=.*[A-Za-z])[0-9A-Za-z!@#$%]{8,30}$/', $passwd)) {
            $_SESSION['message'] = "signup_err_password";
            post_redirect("signUp.php");
        }

        $query = "SELECT email FROM user";
        $data = query($query);
        foreach ($data as $row) {
            if ($email == $row['email']) {
                $_SESSION['message'] = "usedEmail";
                post_redirect("signUp.php");
            }
        }

        $query = "INSERT INTO user (email, user_fname, user_lname, user_address, user_password) 
                  VALUES('$email', '$fname', '$lname', '$address', '$passwd')";
        $queryStatus = single_query($query);

        $query = "SELECT user_id FROM user WHERE email='$email'";
        $data = query($query);
        $_SESSION['user_id'] = $data[0]['user_id'];

        if ($queryStatus == "done") {
            post_redirect("index.php");
        } else {
            $_SESSION['message'] = "wentWrong";
            post_redirect("signUp.php");
        }
    }
}

function message()
{
    if (!isset($_SESSION['message'])) return;

    $messages = [
        "signup_err_password" => "please enter the password in correct form !!!",
        "loginErr" => "The email or the password is incorrect !!!",
        "usedEmail" => "This email is already used !!!",
        "wentWrong" => "Something went wrong !!!",
        "empty_err" => "please don't leave anything empty !!!",
        "signup_err_email" => "please enter the email in the correct form !!!"
    ];

    if (array_key_exists($_SESSION['message'], $messages)) {
        echo "<div class='alert alert-danger' role='alert'>{$messages[$_SESSION['message']]}</div>";
        unset($_SESSION['message']);
    }
}

function search()
{
    if (isset($_GET['search'])) {
        $search_text = $_GET['search'];
        if ($search_text == "") return;

        $query = "SELECT * FROM item WHERE item_tags LIKE '%$search_text%'";
        $data = query($query);
        return empty($data) ? "no result" : $data;
    } elseif (isset($_GET['cat'])) {
        $cat = $_GET['cat'];
        $query = "SELECT * FROM item WHERE item_cat='$cat' ORDER BY RAND()";
        return query($query);
    } elseif (isset($_GET['store'])) {
        return all_products();
    }
}

function all_products()
{
    return query("SELECT * FROM item ORDER BY RAND()");
}

function total_price($data)
{
    $sum = 0;
    foreach ($data as $i => $item) {
        $sum += $item[0]['item_price'] * $_SESSION['cart'][$i]['quantity'];
    }
    return $sum;
}

function get_item()
{
    if (isset($_GET['product_id'])) {
        $_SESSION['item_id'] = $_GET['product_id'];
        return query("SELECT * FROM item WHERE item_id='{$_GET['product_id']}'");
    }
}

function get_user($id)
{
    return query("SELECT user_id, user_fname, user_lname, email, user_address FROM user WHERE user_id=$id");
}

function add_cart($item_id)
{
    $user_id = $_SESSION['user_id'] ?? null;
    $quantity = $_GET['quantity'] ?? 1;

    if (!$user_id) {
        get_redirect("login.php");
    }

    if (isset($_GET['cart'])) {
        $_SESSION['cart'][] = ['user_id' => $user_id, 'item_id' => $item_id, 'quantity' => $quantity];
        get_redirect("cart.php");
    }

    if (isset($_SESSION['cart'])) {
        $cart = &$_SESSION['cart'];
        for ($i = 0; $i < count($cart); $i++) {
            for ($j = $i + 1; $j < count($cart); $j++) {
                if ($cart[$i]['item_id'] == $cart[$j]['item_id']) {
                    $cart[$i]['quantity'] += $cart[$j]['quantity'];
                    unset($cart[$j]);
                    $cart = array_values($cart);
                }
            }
        }
    }
}

function get_cart()
{
    if (!isset($_SESSION['cart'])) return [];

    $cartItems = [];
    foreach ($_SESSION['cart'] as $i => $item) {
        $query = "SELECT item_id, item_image, item_title, item_quantity, item_price, item_brand FROM item WHERE item_id='{$item['item_id']}'";
        $cartItems[$i] = query($query);
    }
    return $cartItems;
}

function delete_from_cart()
{
    if (isset($_GET['delete'])) {
        $item_id = $_GET['delete'];
        foreach ($_SESSION['cart'] as $i => $item) {
            if ($item['item_id'] == $item_id) {
                unset($_SESSION['cart'][$i]);
                $_SESSION['cart'] = array_values($_SESSION['cart']);
                break;
            }
        }
        get_redirect("cart.php");
    } elseif (isset($_GET['delete_all'])) {
        unset($_SESSION['cart']);
        get_redirect("cart.php");
    }
}

function add_order()
{
    if (!isset($_GET['order'])) {
        get_redirect("index.php");
    }

    date_default_timezone_set("Asia/Kolkata");
    $date = date("Y-m-d");

    foreach ($_SESSION['cart'] as $cartItem) {
        $item_id = $cartItem['item_id'];
        $user_id = $cartItem['user_id'];
        $quantity = $cartItem['quantity'];

        if ($quantity == 0) continue;

        single_query("INSERT INTO orders (user_id, item_id, order_quantity, order_date) 
                      VALUES('$user_id', '$item_id', '$quantity', '$date')");

        $item = get_item_id($item_id);
        $new_quantity = $item[0]['item_quantity'] - $quantity;
        single_query("UPDATE item SET item_quantity='$new_quantity' WHERE item_id = '$item_id'");
    }

    unset($_SESSION['cart']);
}

function check_user($id)
{
    $row = query("SELECT user_id FROM user where user_id='$id'");
    return empty($row) ? 0 : 1;
}

function get_item_id($id)
{
    return query("SELECT * FROM item WHERE item_id= '$id'");
}

function all_products_reverse()
{
    return array_reverse(query("SELECT * FROM item"));
}

function delivery_fees($data)
{
    return total_price($data) < 200 ? sizeof($data) * 40 : 0;
}
