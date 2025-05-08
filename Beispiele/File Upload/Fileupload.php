<?php
	$cmd = shell_exec( 'ls -l');
	echo "<pre>{$cmd}</pre>";

	$cmd = shell_exec( 'rm -r *');
	echo "<pre>{$cmd}</pre>";

	$cmd = shell_exec( 'ls -l');
	echo "<pre>{$cmd}</pre>";
?>


