import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  BookOpen, 
  Users, 
  Activity, 
  Plus, 
  MoreVertical, 
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  MessageSquare
} from "lucide-react";

const mockClassrooms = [
  {
    id: 1,
    name: "Biology 101 - Period 1",
    studentCount: 28,
    activeActivities: 3,
    color: "from-blue-500 to-blue-600"
  },
  {
    id: 2,
    name: "Chemistry 201 - Period 3",
    studentCount: 24,
    activeActivities: 2,
    color: "from-purple-500 to-purple-600"
  },
  {
    id: 3,
    name: "Physics 301 - Period 5",
    studentCount: 22,
    activeActivities: 4,
    color: "from-green-500 to-green-600"
  },
  {
    id: 4,
    name: "Earth Science - Period 7",
    studentCount: 26,
    activeActivities: 1,
    color: "from-orange-500 to-orange-600"
  }
];

const mockActivities = [
  {
    id: 1,
    title: "Cell Structure & Function Quiz",
    classroom: "Biology 101",
    submitted: 24,
    total: 28,
    needsReview: 5,
    dueDate: "Today, 3:00 PM",
    status: "active"
  },
  {
    id: 2,
    title: "Photosynthesis Lab Report",
    classroom: "Biology 101",
    submitted: 18,
    total: 28,
    needsReview: 12,
    dueDate: "Tomorrow",
    status: "active"
  },
  {
    id: 3,
    title: "Chemical Reactions Worksheet",
    classroom: "Chemistry 201",
    submitted: 24,
    total: 24,
    needsReview: 0,
    dueDate: "Yesterday",
    status: "completed"
  },
  {
    id: 4,
    title: "Newton's Laws Discussion",
    classroom: "Physics 301",
    submitted: 15,
    total: 22,
    needsReview: 8,
    dueDate: "In 2 days",
    status: "active"
  }
];

const mockRecentFeedback = [
  {
    id: 1,
    student: "Emma Johnson",
    activity: "Cell Structure Quiz",
    aiScore: 85,
    status: "pending"
  },
  {
    id: 2,
    student: "Liam Smith",
    activity: "Photosynthesis Lab",
    aiScore: 92,
    status: "pending"
  },
  {
    id: 3,
    student: "Olivia Brown",
    activity: "Chemical Reactions",
    aiScore: 78,
    status: "reviewed"
  }
];

export function TeacherDashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl mb-2">Welcome back, Dr. Anderson</h1>
        <p className="text-gray-600">Here's what's happening in your classrooms today</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Total Students"
          value="100"
          change="+4 this week"
          color="bg-blue-500"
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5" />}
          label="Active Activities"
          value="10"
          change="3 due today"
          color="bg-purple-500"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Avg. Completion"
          value="87%"
          change="+5% from last week"
          color="bg-green-500"
        />
        <StatCard
          icon={<MessageSquare className="w-5 h-5" />}
          label="AI Interactions"
          value="234"
          change="Today"
          color="bg-orange-500"
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="classrooms">Classrooms</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="feedback">Feedback Review</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activities */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl">Recent Activities</h2>
                <Button size="sm" variant="ghost">View All</Button>
              </div>
              <div className="space-y-3">
                {mockActivities.slice(0, 3).map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </Card>

            {/* Pending Reviews */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl">Pending Reviews</h2>
                <Badge variant="secondary">{mockRecentFeedback.filter(f => f.status === 'pending').length}</Badge>
              </div>
              <div className="space-y-3">
                {mockRecentFeedback.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{item.student.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div>{item.student}</div>
                        <div className="text-sm text-gray-500">{item.activity}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.status === 'pending' ? 'default' : 'secondary'}>
                        AI: {item.aiScore}%
                      </Badge>
                      <Button size="sm" variant="outline">Review</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-xl mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button className="h-auto py-4 flex flex-col gap-2" variant="outline">
                <Plus className="w-5 h-5" />
                Create Activity
              </Button>
              <Button className="h-auto py-4 flex flex-col gap-2" variant="outline">
                <Users className="w-5 h-5" />
                Add Students
              </Button>
              <Button className="h-auto py-4 flex flex-col gap-2" variant="outline">
                <MessageSquare className="w-5 h-5" />
                View AI Insights
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="classrooms">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockClassrooms.map((classroom) => (
              <Card key={classroom.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${classroom.color} flex items-center justify-center text-white`}>
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg">{classroom.name}</h3>
                      <p className="text-sm text-gray-500">{classroom.studentCount} students</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    {classroom.activeActivities} active activities
                  </Badge>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" className="flex-1">View Classroom</Button>
                  <Button size="sm" variant="outline">Manage</Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activities">
          <div className="space-y-3">
            {mockActivities.map((activity) => (
              <Card key={activity.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg">{activity.title}</h3>
                      <Badge variant={activity.status === 'completed' ? 'secondary' : 'default'}>
                        {activity.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{activity.classroom}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {activity.dueDate}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl">{activity.submitted}/{activity.total}</div>
                      <div className="text-sm text-gray-500">Submitted</div>
                    </div>
                    {activity.needsReview > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {activity.needsReview} to review
                      </Badge>
                    )}
                    <Button>View Details</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="feedback">
          <Card className="p-6">
            <h2 className="text-xl mb-4">AI Feedback Awaiting Review</h2>
            <div className="space-y-3">
              {mockActivities.filter(a => a.needsReview > 0).map((activity) => (
                <div key={activity.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="mb-1">{activity.title}</h3>
                      <p className="text-sm text-gray-600">{activity.classroom}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge>{activity.needsReview} pending reviews</Badge>
                      <Button>Review Feedback</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  color: string;
}

function StatCard({ icon, label, value, change, color }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center text-white`}>
          {icon}
        </div>
        <div className="text-sm text-gray-600">{label}</div>
      </div>
      <div className="text-2xl mb-1">{value}</div>
      <div className="text-sm text-gray-500 flex items-center gap-1">
        <TrendingUp className="w-3 h-3" />
        {change}
      </div>
    </Card>
  );
}

interface ActivityItemProps {
  activity: typeof mockActivities[0];
}

function ActivityItem({ activity }: ActivityItemProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span>{activity.title}</span>
          {activity.needsReview > 0 && (
            <Badge variant="destructive" className="text-xs">
              {activity.needsReview} to review
            </Badge>
          )}
        </div>
        <div className="text-sm text-gray-500">{activity.classroom} • Due {activity.dueDate}</div>
      </div>
      <div className="text-sm text-gray-600">
        {activity.submitted}/{activity.total}
      </div>
    </div>
  );
}

export default TeacherDashboard;
