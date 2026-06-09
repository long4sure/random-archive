<?php
require 'db.php';

if(isset($_POST['table'])){

$table = $_POST['table'];

$result = $conn->query("DESCRIBE `$table`");

while($row = $result->fetch_assoc()){

$field = $row['Field'];
$extra = $row['Extra'];

/* SKIP ID + GENERATED */
if($field == 'id' || strpos($extra,'GENERATED') !== false){
continue;
}

$type = strpos($row['Type'],'int') !== false ? 'number' : 'text';

echo "<label>$field</label>";
echo "<input type='$type' name='$field' placeholder='$field'>";
}
}
?>