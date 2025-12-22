import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag } from 'antd';
import { CarOutlined, UserOutlined, FileTextOutlined, ToolOutlined } from '@ant-design/icons';
import { workOrdersApi, clientsApi, carsApi, employeesApi } from '../api';
import dayjs from 'dayjs';

function Dashboard() {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalCars: 0,
    totalEmployees: 0,
    activeWorkOrders: 0,
  });
  const [recentWorkOrders, setRecentWorkOrders] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [clients, cars, employees, workOrders] = await Promise.all([
        clientsApi.getAll(),
        carsApi.getAll(),
        employeesApi.getAll(),
        workOrdersApi.getAll(),
      ]);

      setStats({
        totalClients: clients.data.length,
        totalCars: cars.data.length,
        totalEmployees: employees.data.length,
        activeWorkOrders: workOrders.data.filter(wo => wo.status === 'in_progress').length,
      });

      setRecentWorkOrders(workOrders.data.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const columns = [
    {
      title: 'Bill #',
      dataIndex: 'bill_number',
      key: 'bill_number',
    },
    {
      title: 'Client',
      dataIndex: 'client_name',
      key: 'client_name',
    },
    {
      title: 'Car',
      key: 'car',
      render: (_, record) => `${record.plate} - ${record.brand} ${record.model}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'completed' ? 'green' : 'blue'}>
          {status === 'in_progress' ? 'In Progress' : 'Completed'}
        </Tag>
      ),
    },
    {
      title: 'Start Date',
      dataIndex: 'start_datetime',
      key: 'start_datetime',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Total Cost',
      dataIndex: 'total_cost',
      key: 'total_cost',
      render: (cost) => `$${cost?.toFixed(2) || '0.00'}`,
    },
  ];

  return (
    <div>
      <h2>Dashboard</h2>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Clients"
              value={stats.totalClients}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Cars"
              value={stats.totalCars}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Employees"
              value={stats.totalEmployees}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Work Orders"
              value={stats.activeWorkOrders}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Recent Work Orders">
        <Table
          dataSource={recentWorkOrders}
          columns={columns}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );
}

export default Dashboard;
