<?php
// En basit test — sadece JSON döndür
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
echo json_encode(['status' => 'ok', 'php' => PHP_VERSION, 'time' => date('c')]);
