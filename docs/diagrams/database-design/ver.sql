use master
go

drop database ProductIntro
go
-- Tạo database ProductIntro
create database ProductIntro
go
use ProductIntro
go
-- 1: Tạo Table [accounts] chứa tài khoản thành viên trong hệ thống ----
create table accounts(
	account varchar(20) primary key not null,
	pass varchar(20) not null,
	lastName nvarchar(50) null,
	firstName nvarchar(30) not null,
	birthday datetime ,
	gender bit default 1,		-- 1: male | 0: female
	phone nvarchar(20),			-- Only digits, begin with 03|05|07|08|09
	isUse bit default 0,		-- 1: being used | 0: is prevented
	roleInSystem int default 0	-- Role in system {1: admin,  2: manager, 3: staff: 0: customer}
)
go
-- 2: Tạo Table [categories] chứa thông tin loại sản phẩm, ngành hàng -----------------------------
create table categories(
	typeId int primary key not null identity,
	categoryName nvarchar(88) not null,
	memo ntext default ''
)
go
-- 3: Tạo Table [Products] chứa thông tin của sản phẩm cần giới thiệu --------------
create table products(
	productId varchar(10) primary key not null,
	productName nvarchar(500) not NULL,
	productImage varchar(max) DEFAULT '',
	brief nvarchar(2000) DEFAULT '',
	postedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
	typeId int not null references categories(typeId),
	account varchar(20) not null foreign key references accounts(account) on update cascade,
	unit nvarchar(32) default N'pcs',
	price integer default 0 check (price>=0),
	discount integer default 0 check (discount>=0 and discount<=100)
)
go



create table orders (
	orderId int primary key not null identity,
	account varchar(20) not null foreign key references accounts(account) on update cascade,
	total_price int not null,
	status varchar(20) not null,
	address nvarchar(200) not null,
	phone varchar(20) not null,
	created_at DATETIME DEFAULT GETDATE()
)
go


create table order_items (
	itemId int primary key not null identity,
	orderId int not null foreign key references orders(orderId) on update cascade,
	productId varchar(10) not null foreign key references products(productId),
	price int not null check(price > 0),
	quantity int not null check(quantity > 0)
)
go


create table product_views (
    viewId int primary key identity,
    account varchar(20) not null foreign key references accounts(account),
    productId varchar(10) not null foreign key references products(productId) on update cascade,
    viewTime DATETIME DEFAULT GETDATE()
)
go