import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  BookOpen, 
  Clock, 
  CheckCircle2,
  MessageSquare,
  Award,
  TrendingUp,
  Calendar,
  Bot
} from "lucide-react";

const mockClasses = [
  {
    id: 1,
    name: "Biology 101",
    teacher: "Dr. Anderson",
    color: "from-blue-500 to-blue-600",
    progress: 78,
    nextClass: "Today, 1:00 PM"
  },
  {
    id: 2,
    name: "Chemistry 201",
    teacher: "Mr. Rodriguez",
    color: "from-purple-500 to-purple-600",
    progress: 65,
    nextClass: "Tomorrow, 10:00 AM"
  },
  {
    id: 3,
    name: "Physics 301",
    teacher: "Ms. Chen",
    color: "from-green-500 to-green-600",
    progress: 82,
    nextClass: "Wed, 2:00 PM"
  }
];

const mockAssignments = [
  {
    id: 1,
    title: "Cell Structure & Function Quiz",
    class: "Biology 101",
    dueDate: "Today, 3:00 PM",
    status: "in-progress",
    progress: 60,
    aiHelp: 3
  },
  {
    id: 2,
    title: "Photosynthesis Lab Report",
    class: "Biology 101",
    dueDate: "Tomorrow",
    status: "not-started",
    progress: 0,
    aiHelp: 0
  },
  {
    id: 3,
    title: "Chemical Reactions Worksheet",
    class: "Chemistry 201",
    dueDate: "In 3 days",
    status: "not-started",
    progress: 0,
    aiHelp: 0
  },
  {
    id: 4,
    title: "Newton's Laws Discussion",
    class: "Physics 301",
    dueDate: "In 2 days",
    status: "completed",
    progress: 100,
    aiHelp: 5,
    grade: 92,
    feedback: "pending"
  }
];

const mockRecentActivity = [
  {
    id: 1,
    type: "submission",
    title: "Submitted Newton's Laws Discussion",
    time: "2 hours ago",
    icon: CheckCircle2,
    color: "text-green-500"
  },
  {
    id: 2,
    type: "ai-help",
    title: "Asked AI for help on Cell Structure Quiz",
    time: "4 hours ago",
    icon: Bot,
    color: "text-purple-500"
  },
  {
    id: 3,
    type: "grade",
    title: "Received feedback on Chemical Bonding Lab",
    time: "Yesterday",
    icon: Award,
    color: "text-blue-500"
  }
];

export function StudentDashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl mb-2">Welcome back, Alex!</h1>
        <p className="text-gray-600">You have 2 assignments due today</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<BookOpen className="w-5 h-5" />}
          label="Active Classes"
          value="3"
          color="bg-blue-500"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Pending Tasks"
          value="3"
          color="bg-orange-500"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Completed"
          value="12"
          color="bg-green-500"
        />
        <StatCard
          icon={<Award className="w-5 h-5" />}
          label="Avg. Grade"
          value="88%"
          color="bg-purple-500"
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="classes">My Classes</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Assignments */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl">Upcoming Assignments</h2>
                <Button size="sm" variant="ghost">View All</Button>
              </div>
              <div className="space-y-3">
                {mockAssignments.filter(a => a.status !== 'completed').slice(0, 3).map((assignment) => (
                  <div key={assignment.id} className="p-3 border rounded-lg hover:border-blue-500 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="mb-1">{assignment.title}</h3>
                        <p className="text-sm text-gray-500">{assignment.class}</p>
                      </div>
                      <Badge variant={assignment.status === 'in-progress' ? 'default' : 'secondary'}>
                        {assignment.status === 'in-progress' ? 'In Progress' : 'Not Started'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Clock className="w-4 h-4" />
                      Due {assignment.dueDate}
                    </div>
                    {assignment.progress > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span>{assignment.progress}%</span>
                        </div>
                        <Progress value={assignment.progress} />
                      </div>
                    )}
                    <div className="mt-2">
                      <Button size="sm" className="w-full">
                        {assignment.status === 'in-progress' ? 'Continue' : 'Start Assignment'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl">Recent Activity</h2>
              </div>
              <div className="space-y-3">
                {mockRecentActivity.map((activity) => {
                  const IconComponent = activity.icon;
                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center ${activity.color}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p>{activity.title}</p>
                        <p className="text-sm text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* AI Assistant Card */}
          <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white">
                <Bot className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl mb-1">Need Help?</h2>
                <p className="text-gray-600">Your AI assistant is ready to provide hints and guide you through your assignments</p>
              </div>
              <Button size="lg">
                <MessageSquare className="w-4 h-4 mr-2" />
                Ask AI
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="classes">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockClasses.map((classItem) => (
              <Card key={classItem.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className={`w-full h-24 rounded-lg bg-gradient-to-br ${classItem.color} flex items-center justify-center text-white mb-4`}>
                  <BookOpen className="w-12 h-12" />
                </div>
                <h3 className="text-xl mb-2">{classItem.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{classItem.teacher}</p>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Overall Progress</span>
                      <span>{classItem.progress}%</span>
                    </div>
                    <Progress value={classItem.progress} />
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    Next class: {classItem.nextClass}
                  </div>
                  
                  <Button className="w-full">View Class</Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assignments">
          <div className="space-y-3">
            {mockAssignments.map((assignment) => (
              <Card key={assignment.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg">{assignment.title}</h3>
                      <Badge variant={
                        assignment.status === 'completed' ? 'secondary' : 
                        assignment.status === 'in-progress' ? 'default' : 
                        'outline'
                      }>
                        {assignment.status === 'completed' ? 'Completed' : 
                         assignment.status === 'in-progress' ? 'In Progress' : 
                         'Not Started'}
                      </Badge>
                      {assignment.aiHelp > 0 && (
                        <Badge variant="outline" className="gap-1">
                          <Bot className="w-3 h-3" />
                          {assignment.aiHelp} AI hints used
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{assignment.class}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Due {assignment.dueDate}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {assignment.status === 'completed' && assignment.grade && (
                      <div className="text-center">
                        <div className="text-2xl">{assignment.grade}%</div>
                        <div className="text-sm text-gray-500">
                          {assignment.feedback === 'pending' ? 'Pending review' : 'Graded'}
                        </div>
                      </div>
                    )}
                    <Button>
                      {assignment.status === 'completed' ? 'View Results' : 
                       assignment.status === 'in-progress' ? 'Continue' : 
                       'Start'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="p-6">
            <h2 className="text-xl mb-4">Your Learning Activity</h2>
            <div className="space-y-4">
              {mockRecentActivity.map((activity) => {
                const IconComponent = activity.icon;
                return (
                  <div key={activity.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className={`w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center ${activity.color}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className="mb-1">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
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
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center text-white`}>
          {icon}
        </div>
        <div className="text-sm text-gray-600">{label}</div>
      </div>
      <div className="text-2xl">{value}</div>
    </Card>
  );
}

export default StudentDashboard;
