import { Button, Result } from 'antd';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F5F5F7',
      }}
    >
      <Result
        status="404"
        title="Page Not Found"
        subTitle="Sorry, the page you visited does not exist."
        extra={
          <Link href="/dashboard">
            <Button type="primary">Back to Dashboard</Button>
          </Link>
        }
      />
    </div>
  );
}
