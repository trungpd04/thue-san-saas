<!DOCTYPE html>
<html>
<head>
    <title>Simulate SePay Payment</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
    <div class="container py-5">
        <div class="card shadow">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0">Giả lập thanh toán SePay (BankHub)</h5>
            </div>
            <div class="card-body">
                @if(session('status'))
                    <div class="alert alert-info">{{ session('status') }}</div>
                @endif

                <h6>Danh sách đơn đặt sân chờ thanh toán (Pending)</h6>
                <table class="table table-striped mt-3">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Khách hàng</th>
                            <th>Tổng tiền</th>
                            <th>Ngày đặt</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($bookings as $booking)
                            <tr>
                                <td>BK{{ $booking->id }}</td>
                                <td>{{ $booking->customer->name ?? 'N/A' }}</td>
                                <td>{{ number_format($booking->total_price) }}đ</td>
                                <td>{{ $booking->booking_date->format('d/m/Y') }}</td>
                                <td>
                                    <form action="{{ route('tenant.sepay.simulate.pay', ['tenant' => tenant()->slug, 'booking' => $booking->id]) }}" method="POST">
                                        @csrf
                                        <button type="submit" class="btn btn-success btn-sm">Gửi Webhook Giả Lập</button>
                                    </form>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="5" class="text-center">Không có đơn hàng nào chờ thanh toán.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
                
                <hr>
                <a href="{{ route('tenant.sepay.settings', ['tenant' => tenant()->slug]) }}" class="btn btn-secondary">Quay lại cài đặt SePay</a>
            </div>
        </div>
    </div>
</body>
</html>
