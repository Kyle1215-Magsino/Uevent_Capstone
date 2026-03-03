<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = App\Models\User::where('email', 'admin@ueventtrack.com')->first();
if (!$user) {
    echo "User NOT FOUND\n";
    exit(1);
}
echo "User found: {$user->name} (role: {$user->role})\n";
echo "Password hash check: " . (Illuminate\Support\Facades\Hash::check('password', $user->password) ? 'VALID' : 'INVALID') . "\n";
