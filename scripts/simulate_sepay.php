<?php

// Simulate a SePay webhook request
$slug = 'anh-duc'; // Change to your tenant slug
$bookingId = 6;     // Change to your booking ID
$amount = 300000;   // Change to booking price
$webhookToken = '9UME5PNQANIU89VFCFIBJSKNLHJGPER2WJDOTDEBNWRYX1TFDXAY3XQRHWG2S1HO';
$url = "https://grievous-hunting-freeing.ngrok-free.dev/api/webhooks/sepay/bankhub";

$payload = [
    'event_type' => 'TRANSACTION_NEW',
    'data' => [
        'content' => "BK{$bookingId}",
        'amount_in' => $amount,
        'transaction_id' => 'SIM-' . time(),
        'reference_number' => 'REF' . time(),
    ]
];

echo "Sending simulation request to: {$url}\n";
echo "Payload: " . json_encode($payload, JSON_PRETTY_PRINT) . "\n\n";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Skip SSL verification for simulation
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-Secret-Key: ' . $webhookToken
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    echo 'Error:' . curl_error($ch);
} else {
    echo "HTTP Status: {$httpCode}\n";
    echo "Response: {$response}\n";
}

curl_close($ch);
