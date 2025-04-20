<?php
$websiteUrl = "https://bot.dialogflow.com/6e95cf73-2bbf-477d-be17-3b0361472297"; // Replace this with the URL you want to open

// Redirect to the specified website
header("Location: $websiteUrl");
exit; // Ensure that subsequent code is not executed after redirection
?>