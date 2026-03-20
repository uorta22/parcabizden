<?php
/**
 * email.php — E-posta gönderimi (SMTP AUTH)
 * smtp_send, build_email_html, send_verification_email, send_reset_email
 *
 * Natro cPanel'den noreply@parcabizden.com.tr e-posta hesabı oluşturun.
 * Sabitler: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_NAME
 * (natro-index.php'de define edilmiş)
 */

function smtp_send($to, $subject_text, $html_body) {
    $from = SMTP_USER;
    $subject = '=?UTF-8?B?' . base64_encode($subject_text) . '?=';

    // Build full email message
    $msg  = "From: " . SMTP_FROM_NAME . " <$from>\r\n";
    $msg .= "To: $to\r\n";
    $msg .= "Subject: $subject\r\n";
    $msg .= "MIME-Version: 1.0\r\n";
    $msg .= "Content-Type: text/html; charset=UTF-8\r\n";
    $msg .= "Content-Transfer-Encoding: base64\r\n";
    $msg .= "\r\n";
    $msg .= chunk_split(base64_encode($html_body));

    // Connect to SMTP
    $sock = @fsockopen(SMTP_HOST, SMTP_PORT, $errno, $errstr, 10);
    if (!$sock) {
        // Try SSL on 465
        $sock = @fsockopen('ssl://' . SMTP_HOST, 465, $errno, $errstr, 10);
    }
    if (!$sock) {
        @file_put_contents(__DIR__ . '/email_debug.log',
            date('Y-m-d H:i:s') . " CONNECT FAIL: $errstr ($errno)\n", FILE_APPEND);
        return false;
    }

    $log = '';
    $read = function() use ($sock, &$log) {
        $r = ''; $t = 0;
        while ($t < 10) {
            $line = @fgets($sock, 512);
            if ($line === false) break;
            $r .= $line;
            if (isset($line[3]) && $line[3] === ' ') break; // last line of multi-line
            $t++;
        }
        $log .= "S: $r";
        return $r;
    };
    $write = function($cmd) use ($sock, &$log) {
        // Don't log password
        if (stripos($cmd, 'AUTH') !== false || strlen($cmd) > 50) {
            $log .= "C: [hidden]\n";
        } else {
            $log .= "C: $cmd";
        }
        @fwrite($sock, $cmd);
    };

    $resp = $read();
    if (substr($resp, 0, 3) !== '220') { @fclose($sock); return false; }

    // EHLO
    $write("EHLO parcabizden.com.tr\r\n");
    $ehlo_resp = $read();

    // STARTTLS if available
    if (stripos($ehlo_resp, 'STARTTLS') !== false && SMTP_PORT == 587) {
        $write("STARTTLS\r\n");
        $resp = $read();
        if (substr($resp, 0, 3) === '220') {
            stream_socket_enable_crypto($sock, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            // Re-EHLO after TLS
            $write("EHLO parcabizden.com.tr\r\n");
            $read();
        }
    }

    // AUTH LOGIN
    $write("AUTH LOGIN\r\n");
    $resp = $read();
    if (substr($resp, 0, 3) !== '334') {
        @file_put_contents(__DIR__ . '/email_debug.log',
            date('Y-m-d H:i:s') . " AUTH NOT SUPPORTED\n$log\n", FILE_APPEND);
        @fwrite($sock, "QUIT\r\n"); @fclose($sock); return false;
    }
    $write(base64_encode(SMTP_USER) . "\r\n");
    $resp = $read();
    $write(base64_encode(SMTP_PASS) . "\r\n");
    $resp = $read();
    if (substr($resp, 0, 3) !== '235') {
        @file_put_contents(__DIR__ . '/email_debug.log',
            date('Y-m-d H:i:s') . " AUTH FAILED\n$log\n", FILE_APPEND);
        @fwrite($sock, "QUIT\r\n"); @fclose($sock); return false;
    }

    // MAIL FROM
    $write("MAIL FROM:<$from>\r\n");
    $resp = $read();
    if (substr($resp, 0, 3) !== '250') { @fwrite($sock, "QUIT\r\n"); @fclose($sock); return false; }

    // RCPT TO
    $write("RCPT TO:<$to>\r\n");
    $resp = $read();
    if (substr($resp, 0, 3) !== '250') { @fwrite($sock, "QUIT\r\n"); @fclose($sock); return false; }

    // DATA
    $write("DATA\r\n");
    $resp = $read();
    if (substr($resp, 0, 3) !== '354') { @fwrite($sock, "QUIT\r\n"); @fclose($sock); return false; }

    @fwrite($sock, $msg . "\r\n.\r\n");
    $resp = $read();
    $write("QUIT\r\n");
    @fclose($sock);

    $code = (int)substr($resp, 0, 3);
    if ($code >= 200 && $code < 300) return true;

    @file_put_contents(__DIR__ . '/email_debug.log',
        date('Y-m-d H:i:s') . " SEND FAIL code=$code\n$log\n", FILE_APPEND);
    return false;
}

function build_email_html($title, $greeting, $body_text, $button_url, $button_text, $note) {
    $html = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">';
    $html .= '<div style="max-width:500px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">';
    $html .= '<div style="background:#f97316;padding:24px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:22px;">Parca<span style="color:#1e293b;">Bizden</span></h1></div>';
    $html .= '<div style="padding:32px 24px;text-align:center;">';
    $html .= '<h2 style="color:#1e293b;margin:0 0 8px;">' . htmlspecialchars($greeting) . '</h2>';
    $html .= '<p style="color:#64748b;font-size:15px;">' . htmlspecialchars($body_text) . '</p>';
    $html .= '<a href="' . $button_url . '" style="display:inline-block;margin:24px 0;padding:14px 32px;background:#f97316;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">' . htmlspecialchars($button_text) . '</a>';
    $html .= '<p style="color:#94a3b8;font-size:13px;">' . htmlspecialchars($note) . '</p>';
    $html .= '<p style="color:#94a3b8;font-size:12px;margin-top:16px;">Bu islemi siz yapmadiysan bu e-postayi gormezden gelebilirsiniz.</p>';
    $html .= '</div></div></body></html>';
    return $html;
}

function send_verification_email($email, $name, $token) {
    $url = "https://parcabizden.com.tr/dogrula?token=" . urlencode($token);
    $html = build_email_html(
        'E-posta Dogrulamasi',
        "Merhaba $name!",
        'Hesabinizi aktif etmek icin asagidaki butona tiklayin.',
        $url, 'E-postami Dogrula', 'Bu link 24 saat gecerlidir.'
    );
    smtp_send($email, 'ParcaBizden - E-posta Dogrulamasi', $html);
}

function send_reset_email($email, $name, $token) {
    $url = "https://parcabizden.com.tr/sifre-sifirla?token=" . urlencode($token);
    $html = build_email_html(
        'Sifre Sifirlama',
        "Merhaba $name!",
        'Sifrenizi sifirlamak icin asagidaki butona tiklayin.',
        $url, 'Sifremi Sifirla', 'Bu link 1 saat gecerlidir.'
    );
    smtp_send($email, 'ParcaBizden - Sifre Sifirlama', $html);
}
