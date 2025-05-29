export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on-hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate: Date;
  endDate?: Date;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  teamMembers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectInput {
  name: string;
  description: string;
  status?: 'active' | 'completed' | 'on-hold' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  startDate?: Date;
  endDate?: Date;
  teamMembers?: string[];
}
