<!DOCTYPE html>
<html>
<body>
    <h2>Xin chào {{ $subscription->tenant->name }},</h2>
    <p>Gói dịch vụ <strong>{{ $subscription->plan->name }}</strong> của bạn sẽ hết hạn vào ngày 
       <strong>{{ $subscription->ends_at->format('d/m/Y') }}</strong>.</p>
    <p>Vui lòng đăng nhập vào hệ thống để thực hiện gia hạn, tránh làm gián đoạn dịch vụ.</p>
    <p><a href="{{ url('/tenant/'.$subscription->tenant->slug.'/subscription/register') }}" 
          style="padding: 10px 20px; background: #1890ff; color: white; text-decoration: none; border-radius: 5px;">
        Gia hạn ngay
    </a></p>
    <p>Trân trọng,<br>Đội ngũ hỗ trợ.</p>
</body>
</html>