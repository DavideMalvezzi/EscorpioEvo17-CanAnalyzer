<?php

$conn = NULL;

function connectToDb(){
  global $conn;

	$servername = "localhost";
  $username = "root";
	$password = "rootroot";
	$db = "telemetry_teamzeroc";

	$conn = new mysqli($servername, $username, $password, $db);

  if ($conn->connect_error) {
    die('<p style="color: red"> Connection failed: ' . $conn->connect_error . '<p>');
  }
}

function disconnectFromDb(){
  global $conn;

  $conn->close();
}
?>
