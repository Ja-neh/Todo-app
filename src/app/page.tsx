import { getTasks, getAllTopics } from '@/lib/db';
import TaskDashboard from '@/components/TaskDashboard';

export const dynamic = 'force-dynamic';

export default function Home() {
  const initialTasks = getTasks();
  const initialTopics = getAllTopics();

  return (
    <TaskDashboard
      initialTasks={initialTasks}
      initialTopics={initialTopics}
    />
  );
}
