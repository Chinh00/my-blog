---
title: "Primary–replica database: từ cách hoạt động đến những bẫy khi vận hành"
description: "Replication không chỉ là thêm một database để đọc. Bài viết giải thích primary–replica, replication lag, tính nhất quán, failover và những điều cần giám sát trong production."
pubDate: 2026-07-16
tags: ["công nghệ", "database", "backend"]
---

Khi một ứng dụng bắt đầu đông người dùng, database thường là nơi chịu áp lực sớm nhất. Một giải pháp hay được nhắc đến là **master–slave database**: ghi vào một máy, đọc từ nhiều máy khác.

Ý tưởng nghe đơn giản. Nhưng từ lúc vẽ được sơ đồ đến lúc vận hành an toàn trong production là một khoảng cách khá xa. Dữ liệu có thể chưa kịp đồng bộ, người dùng vừa cập nhật hồ sơ đã thấy thông tin cũ, replica có thể đầy ổ đĩa, và một quy trình failover thiếu kiểm soát có thể tạo ra hai database cùng nhận ghi.

Bài này đi từ nguyên lý đến các quyết định thực tế cần hiểu trước khi dùng replication.

> **Về thuật ngữ:** “master–slave” vẫn xuất hiện trong nhiều tài liệu và hệ thống cũ. Các tài liệu hiện đại thường dùng **primary–replica**, **source–replica** hoặc **leader–follower**. Trong bài, mình dùng *primary–replica*: primary là nơi nhận ghi chính, replica là bản sao nhận thay đổi từ primary.

## Primary–replica là gì?

Mô hình cơ bản có một database **primary** và một hoặc nhiều **replica**:

```text
                         ┌─────────────┐
              ghi ─────► │   Primary   │
                         │ read/write  │
                         └──────┬──────┘
                                │ replication log
                    ┌───────────┴───────────┐
                    ▼                       ▼
             ┌─────────────┐         ┌─────────────┐
đọc ───────► │  Replica 1  │         │  Replica 2  │ ◄────── đọc
             │  read-only  │         │  read-only  │
             └─────────────┘         └─────────────┘
```

Ứng dụng thường gửi `INSERT`, `UPDATE`, `DELETE` đến primary. Các truy vấn chỉ đọc có thể được phân phối sang replica để giảm CPU, I/O và số kết nối trên primary.

Cách này đặc biệt hữu ích với hệ thống có lượng đọc lớn hơn nhiều lượng ghi: trang nội dung, danh mục sản phẩm, báo cáo, tìm kiếm nội bộ hoặc dashboard phân tích.

Tuy nhiên, replica không phải một bản sao được chụp lại toàn bộ sau mỗi câu lệnh. Database thường sao chép **dòng lịch sử thay đổi**.

## Dữ liệu được sao chép như thế nào?

Database đã có cơ chế ghi log để bảo đảm khả năng khôi phục. Replication tận dụng chính dòng log đó.

Với PostgreSQL, primary tạo **WAL — Write-Ahead Log**. Standby nhận các WAL record và replay chúng. Với MySQL, các thay đổi được ghi vào **binary log**; replica lấy các event, lưu vào relay log rồi thực thi lại.

Có thể hình dung một giao dịch đi qua các bước:

1. Ứng dụng gửi giao dịch đến primary.
2. Primary thay đổi dữ liệu và ghi sự kiện vào WAL hoặc binary log.
3. Primary trả kết quả commit cho ứng dụng, tùy chế độ đồng bộ.
4. Replica nhận log qua mạng.
5. Replica ghi log xuống đĩa.
6. Replica replay log để dữ liệu cục bộ phản ánh thay đổi.

Các bước này không nhất thiết hoàn thành cùng lúc. Khoảng cách giữa trạng thái của primary và replica tạo ra **replication lag**.

## Bất đồng bộ, đồng bộ và bán đồng bộ

### Replication bất đồng bộ

Đây là chế độ phổ biến và thường là mặc định. Primary có thể xác nhận commit mà không chờ replica nhận hoặc áp dụng thay đổi.

Ưu điểm là độ trễ ghi thấp: đường truyền chậm hoặc replica quá tải không trực tiếp giữ giao dịch của người dùng lại. Đổi lại, nếu primary hỏng trước khi log được chuyển đi, replica được promote có thể thiếu một số giao dịch vừa commit.

Nói cách khác, hệ thống chấp nhận một **cửa sổ có khả năng mất dữ liệu** để đổi lấy hiệu năng và khả năng chịu độ trễ mạng.

### Replication đồng bộ

Ở chế độ đồng bộ, primary chờ xác nhận từ một hay nhiều replica trước khi báo commit thành công. Điều này thu hẹp đáng kể rủi ro mất giao dịch đã được xác nhận, nhưng mỗi lần ghi phải trả thêm chi phí chờ mạng và chờ replica.

Nếu replica bắt buộc bị chậm hoặc mất kết nối, giao dịch trên primary cũng có thể bị chậm hoặc không hoàn tất. Vì vậy “đồng bộ” không miễn phí; nó chuyển một phần rủi ro mất dữ liệu thành rủi ro giảm tính sẵn sàng hoặc tăng latency.

### Replication bán đồng bộ

MySQL hỗ trợ semisynchronous replication qua plugin. Primary chờ ít nhất một replica xác nhận đã **nhận và ghi** event vào relay log, nhưng không nhất thiết chờ event được thực thi hoàn toàn trên replica.

Đây là điểm cân bằng giữa hai phía: dữ liệu đã tồn tại ở ít nhất hai nơi khi commit thành công, trong khi thời gian chờ thường thấp hơn mô hình bắt mọi replica áp dụng xong giao dịch. Dù vậy, chi phí tối thiểu vẫn bao gồm một vòng khứ hồi mạng.

Không có chế độ tốt nhất cho mọi hệ thống. Câu hỏi đúng là:

- Doanh nghiệp chấp nhận mất tối đa bao nhiêu dữ liệu khi sự cố xảy ra — **RPO**?
- Hệ thống chấp nhận ngừng phục vụ bao lâu — **RTO**?
- Giao dịch ghi được phép chậm thêm bao nhiêu mili giây?

## Replication lag và lỗi “vừa ghi xong đã biến mất”

Giả sử người dùng đổi tên từ “An” thành “An Nguyễn”:

```text
1. UPDATE chạy thành công trên primary
2. Trang chuyển hướng sang màn hình hồ sơ
3. SELECT hồ sơ được gửi đến replica
4. Replica chưa replay UPDATE
5. Màn hình vẫn hiện tên “An”
```

Dữ liệu không mất. Truy vấn chỉ đọc đã đến một bản sao đang chậm hơn primary. Đây là hiện tượng thiếu **read-after-write consistency**.

Một vài chiến lược thường dùng:

### Đọc từ primary sau khi ghi

Trong một khoảng thời gian ngắn sau thao tác cập nhật, các truy vấn liên quan của chính người dùng đó được gửi về primary. Cách này dễ hiểu và phù hợp với hồ sơ cá nhân, giỏ hàng hoặc trạng thái đơn hàng.

### Sticky session

Gắn request của người dùng vào primary trong phiên vừa có ghi. Cần cẩn thận vì trạng thái định tuyến làm hệ thống phức tạp hơn, nhất là khi có nhiều service hoặc nhiều lớp proxy.

### Chờ replica đạt đến một vị trí log

Sau khi ghi, ứng dụng hoặc middleware giữ lại vị trí WAL/binlog và chỉ đọc từ replica khi replica đã replay đến vị trí đó. Cách này chính xác hơn nhưng phụ thuộc database, driver và hạ tầng định tuyến.

### Chấp nhận eventual consistency

Không phải dữ liệu nào cũng cần mới tuyệt đối. Lượt xem, feed nội dung, thống kê tổng hợp hay danh sách gợi ý thường có thể chậm vài giây. Điều quan trọng là sự chấp nhận này phải là một quyết định sản phẩm, không phải một bất ngờ trong production.

Ngoài độ trễ thời gian, nên theo dõi cả **độ lệch theo byte hoặc vị trí log**. Một replica “chậm 2 giây” khi hệ thống yên tĩnh khác hoàn toàn “chậm 2 giây” lúc primary tạo hàng trăm MB log mỗi giây.

## Read replica giúp scale điều gì?

Replica giúp **scale read**, không tự động scale write.

Nếu 90% tải là `SELECT`, việc thêm replica và phân phối truy vấn có thể giảm tải đáng kể cho primary. Các truy vấn báo cáo nặng cũng có thể được tách khỏi đường giao dịch chính.

Nhưng mọi thay đổi vẫn phải đi qua primary và còn tạo thêm công việc:

- Primary phải sinh và truyền replication log.
- Mỗi replica cần đủ CPU, I/O và băng thông để replay kịp tốc độ ghi.
- Index mới làm tăng chi phí ghi trên primary và phải được duy trì ở replica.
- Một truy vấn tệ không trở thành truy vấn tốt chỉ vì chạy trên máy khác.

Nếu nút thắt nằm ở write throughput, cần xem xét tối ưu schema và transaction, batching, partitioning, cache phù hợp, hàng đợi, hoặc cuối cùng là sharding. Thêm read replica không chữa được một primary đang nghẽn vì ghi.

## High availability không chỉ là “có một replica”

Replica là nguyên liệu để xây high availability, chưa phải toàn bộ hệ thống HA.

Khi primary hỏng, một replica cần được **promote** để nhận ghi. Ứng dụng sau đó phải tìm được primary mới. Quy trình này gồm nhiều quyết định khó:

1. Làm sao xác định primary thật sự đã hỏng, thay vì chỉ mất mạng tạm thời?
2. Chọn replica nào có dữ liệu mới nhất?
3. Làm sao ngăn primary cũ tiếp tục nhận ghi?
4. Cập nhật DNS, virtual IP, proxy hoặc service discovery thế nào?
5. Các replica còn lại sẽ theo primary mới ra sao?
6. Primary cũ quay lại thì tái gia nhập bằng cách nào?

Nguy hiểm nhất là **split brain**: hai node đều tin mình là primary và cùng chấp nhận ghi. Hai lịch sử dữ liệu bắt đầu phân nhánh; việc ghép lại thường không thể giải quyết chỉ bằng một lệnh tự động.

Một hệ thống failover tốt cần cơ chế quorum hoặc một nguồn quyết định đáng tin cậy, health check đủ chắc chắn và **fencing** để cô lập node cũ trước khi mở ghi ở node mới. Các công cụ như Patroni cho PostgreSQL, Orchestrator hoặc Group Replication trong hệ sinh thái MySQL, hay dịch vụ managed database có thể đảm nhiệm một phần quy trình — nhưng đội vận hành vẫn cần hiểu điều gì xảy ra khi tự động hóa thất bại.

Và quan trọng: hãy diễn tập failover. Một runbook chưa từng chạy chỉ là một giả thuyết.

## Replication không phải backup

Nếu ai đó chạy nhầm:

```sql
DROP TABLE orders;
```

replication sẽ làm đúng nhiệm vụ của nó: chuyển thay đổi đó sang các replica. Dữ liệu bị xóa rất nhanh và rất đồng đều.

Điều tương tự xảy ra với `DELETE` thiếu điều kiện, dữ liệu bị mã hóa bởi tài khoản đã bị chiếm quyền, hoặc lỗi ứng dụng ghi giá trị sai. Replica bảo vệ trước **hỏng máy**, không bảo vệ đầy đủ trước **hỏng logic**.

Backup đúng nghĩa cần có lịch sử độc lập và khả năng khôi phục về một thời điểm trước sự cố, thường gồm:

- Base backup hoặc snapshot định kỳ.
- Lưu trữ WAL/binlog để point-in-time recovery.
- Bản sao nằm ở failure domain khác.
- Chính sách retention rõ ràng.
- Mã hóa và kiểm soát quyền truy cập.
- Restore test định kỳ.

Một bản backup chưa từng được restore thử chỉ là một niềm hy vọng có dung lượng lớn.

## Những chỉ số nên giám sát

Một dashboard replication tối thiểu nên trả lời được các câu hỏi sau.

### Replica còn kết nối không?

Theo dõi trạng thái sender/receiver, lần cuối nhận heartbeat hoặc log, số lần reconnect và lỗi replication. “Process vẫn chạy” chưa đủ nếu luồng log đã đứng yên.

### Replica đang chậm ở đâu?

Tách các giai đoạn nếu database hỗ trợ:

- **Send lag:** primary chưa gửi hết log.
- **Receive/write lag:** replica chưa nhận hoặc chưa ghi log xuống đĩa.
- **Flush lag:** log chưa được flush bền vững.
- **Replay/apply lag:** log đã có trên replica nhưng chưa áp dụng vào dữ liệu.

Sự phân tách này giúp nhận ra nút thắt nằm ở primary, mạng, ổ đĩa hay khả năng replay của replica.

### Replica có đủ tài nguyên không?

Theo dõi CPU, IOPS, latency ổ đĩa, băng thông, connection, dung lượng và tốc độ tăng log. PostgreSQL replication slot có thể giữ WAL để replica bị ngắt kết nối bắt kịp sau; nếu không đặt giới hạn và cảnh báo, lượng WAL bị giữ có thể làm đầy ổ đĩa primary.

### Dữ liệu có an toàn để failover không?

Biết replica nào mới nhất, transaction nào đã được xác nhận ở đâu, và độ lệch hiện tại có nằm trong RPO cam kết hay không. Đừng đợi đến lúc primary mất mới bắt đầu tìm câu trả lời.

### Truy vấn đọc có đang gây hại cho replay không?

Trên PostgreSQL hot standby, truy vấn dài có thể xung đột với WAL replay. Hệ thống có thể trì hoãn replay hoặc hủy truy vấn để tiếp tục đồng bộ. Nếu bật cơ chế feedback để giảm hủy truy vấn, primary lại có nguy cơ giữ row version cũ lâu hơn và bị table bloat. Replica phục vụ báo cáo dài và replica dành cho HA đôi khi nên là hai node có cấu hình khác nhau.

## Một kiến trúc khởi đầu thực tế

Với một sản phẩm vừa bắt đầu cần HA và read scaling, kiến trúc có thể là:

```text
                           ┌──────────────────┐
Application ─────────────► │ DB proxy/router  │
                           └───────┬──────────┘
                                   │
                  write / critical read
                                   ▼
                            ┌─────────────┐
                            │   Primary   │
                            └──────┬──────┘
                                   │
                         replication stream
                     ┌─────────────┴─────────────┐
                     ▼                           ▼
              ┌─────────────┐             ┌─────────────┐
              │ HA replica  │             │ Read replica│
              │ ưu tiên mới │             │ báo cáo/read│
              └─────────────┘             └─────────────┘

         Backup + WAL/binlog archive ─────► object storage độc lập
```

Replica dành cho HA nên ưu tiên theo kịp primary và có chính sách hạn chế truy vấn dài. Replica đọc có thể nhận dashboard, báo cáo hoặc traffic eventual consistency. Hai mục tiêu khác nhau không nhất thiết phải nhồi vào cùng một node.

Trước khi triển khai, nên viết rõ:

- Query nào bắt buộc đọc từ primary?
- Query nào chấp nhận dữ liệu cũ, và cũ tối đa bao lâu?
- RPO/RTO của hệ thống là gì?
- Ai hoặc công cụ nào được quyền promote replica?
- Cơ chế fencing primary cũ là gì?
- Ứng dụng đổi endpoint bằng cách nào?
- Backup nằm ở đâu và lần restore test gần nhất là khi nào?
- Cảnh báo replication lag, lỗi replication và dung lượng WAL/binlog ở ngưỡng nào?

## Kết luận

Primary–replica là một trong những mẫu kiến trúc database hữu ích nhất: nó mở rộng khả năng đọc, tách tải phân tích và cung cấp nền tảng cho high availability. Nhưng nó đưa tính nhất quán, định tuyến và failover từ bên trong một database đơn lẻ thành bài toán của cả hệ thống.

Ba điều đáng nhớ nhất:

1. **Replica có thể chậm**, nên phải thiết kế rõ read-after-write và eventual consistency.
2. **Failover là một quy trình**, không phải tác dụng tự nhiên của việc có thêm server.
3. **Replication không thay thế backup**, vì lỗi logic cũng được sao chép rất hiệu quả.

Nếu hệ thống còn nhỏ, một database được tối ưu tốt và backup tử tế thường đáng giá hơn một cụm replication vận hành nửa vời. Khi thực sự cần replica, hãy bắt đầu từ yêu cầu RPO, RTO và consistency — rồi mới chọn topology và công cụ.

## Nguồn tham khảo

- [PostgreSQL 18 — Log-Shipping Standby Servers](https://www.postgresql.org/docs/current/warm-standby.html)
- [PostgreSQL 18 — Hot Standby](https://www.postgresql.org/docs/current/hot-standby.html)
- [MySQL 8.0 — Replication Implementation](https://docs.oracle.com/cd/E17952_01/mysql-8.0-en/replication-implementation.html)
- [MySQL 8.0 — Semisynchronous Replication](https://docs.oracle.com/cd/E17952_01/mysql-8.0-en/replication-semisync.html)
- [Amazon RDS — Working with DB instance read replicas](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html)
- [MariaDB — Replication Overview](https://mariadb.com/docs/server/ha-and-performance/standard-replication/replication-overview)
