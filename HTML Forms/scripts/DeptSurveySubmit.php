<?php 
	$file = "../data/" . $_POST['techDept'] . "SurveyData.csv";

	$cur .= file_exists($file) ? file_get_contents($file) . "\n" : "";
		
	list($date, $time, $ampm) = explode(" ",$_POST['formDate']);
	list($mon, $day, $year) = explode("/", $date);
	list($hour, $min, $sec) = explode(":",$time);

	$cur .= $year . "," . $mon . "," . $day;
	$cur .= "," . ($hour + ($ampm == "PM" ? 12 : 0)) . $min;
  $cur .= "," . $_POST['userName'];
  $cur .= "," . $_POST['userDept'];
  $cur .= "," . $_POST['techName'];
  $cur .= "," . $_POST['techDept'];
  $cur .= "," . $_POST['task'];
  $cur .= "," . $_POST['timeSpent'];
  $cur .= "," . $_POST['rating'];
  $cur .= "," . preg_replace("/\r\n?/", " ", $_POST['comments']);

	file_put_contents($file, $cur);
	
	header("Location: http://app-server2/Forms/HTMLForms/DepartmentalSurvey.html?Success=true");
	end();
?>