'use client';

import React, { useState } from 'react';
import { BarChart3, Mail, Users, Settings, Gift, Tag } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import các components
import DashboardComponent from "@/components/admin/marketing/DashboardComponent";
import CampaignsComponent from "@/components/admin/marketing/CampaignsComponent";
import SegmentsComponent from "@/components/admin/marketing/SegmentsComponent";
// import RulesComponent from "@/components/admin/marketing/RulesComponent";
// import VouchersComponent from "@/components/admin/marketing/VouchersComponent";
// import TemplatesComponent from "@/components/admin/marketing/TemplatesComponent";

export default function MarketingEmailPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quản lý Marketing Email</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="segments" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Segments
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Rules
          </TabsTrigger>
          <TabsTrigger value="vouchers" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Vouchers
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <DashboardComponent />
        </TabsContent>

        <TabsContent value="campaigns">
          <CampaignsComponent />
        </TabsContent>

        <TabsContent value="segments">
          <SegmentsComponent />
        </TabsContent>

        <TabsContent value="rules">
          <div className="text-center py-12">
            <p className="text-gray-500">Rules Component - Sẽ tạo tiếp</p>
          </div>
        </TabsContent>

        <TabsContent value="vouchers">
          <div className="text-center py-12">
            <p className="text-gray-500">Vouchers Component - Sẽ tạo tiếp</p>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <div className="text-center py-12">
            <p className="text-gray-500">Templates Component - Sẽ tạo tiếp</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}