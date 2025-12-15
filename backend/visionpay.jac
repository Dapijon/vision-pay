
// 1. node-definitions (Data Model)

node officer {
    has id;
    has name;
    has lat: float;
    has lng: float;
    has members_assigned: int = 0;
    has collections_today: int = 0;
}

node member {
    has id;
    has name;
    has lat: float;
    has lng: float;
    has amount: float;
    has payment_status: str = "pending"; // paid, pending, overdue
    has officer_id: int = 0; // 0 means unassigned
    has payment_date: str = "N/A";
}

node zone {
    has zone_name;
    has risk_level: str; // high, medium, low
    has overdue_rate: int;
    has members_count: int;
}

node stats_holder {
    has total_members: int = 0;
    has paid_today: int = 0;
    has overdue_members: int = 0;
    has total_collected: float = 0.0;
}

// 2. EDGE DEFINITIONS (Relationships)

// Links officers and members
with -> member_assigned_to;
// Links members to their payment zones
with -> in_zone;
// Links the stats holder to the root node
with -> has_stats;


// 3. INITIALIZATION (Setup Graph with Mock Data)

walker init_graph {
    root {
        // Create Stats Holder
        spawn node::stats_holder;
        -> has_stats;

        // Create Officers
        spawn node::officer(
            id=1, 
            name='John Kamau', 
            lat=-1.2921, 
            lng=36.8219, 
            members_assigned=45, 
            collections_today=12
        );
        spawn node::officer(
            id=2, 
            name='Mary Njeri', 
            lat=-1.3012, 
            lng=36.8345, 
            members_assigned=38, 
            collections_today=15
        );
        
        // Create Members
        spawn node::member(
            id=1, 
            name='Grace Wanjiku', 
            amount=500.0, 
            payment_status='paid',
            officer_id=1,
            lat=-1.2925, 
            lng=36.8220
        );
        spawn node::member(
            id=2, 
            name='David Mwangi', 
            amount=750.0, 
            payment_status='pending',
            officer_id=1,
            lat=-1.2945, 
            lng=36.8267
        );
        spawn node::member(
            id=3, 
            name='Sarah Akinyi', 
            amount=1000.0, 
            payment_status='overdue',
            officer_id=2,
            lat=-1.2889, 
            lng=36.8201
        );
        
        // Create Risk Zones
        spawn node::zone(
            zone_name='Kibera Zone A', 
            risk_level='high', 
            overdue_rate=35, 
            members_count=23
        );
        spawn node::zone(
            zone_name='Eastleigh Zone B', 
            risk_level='medium', 
            overdue_rate=18, 
            members_count=41
        );
    }
}


// =================================================================
// 4. MAIN WALKER (API Handlers)
// =================================================================
// NOTE: This walker holds the logic for all API endpoints in App.js
//       under the /walker/ path.

walker walker {
    
    // API 1: /walker/GetDashboardStats
    has total_members = 0;
    has paid_today = 0;
    has overdue_members = 0;
    has total_collected = 0.0;

    // Use a destructor to compile stats from members
    // This runs before the walker exits if triggered
    destr {
        // Collect stats from all Member nodes
        visit --> node::member by member_walker;
    }

    // Walker ability to collect and return stats
    ability GetDashboardStats with entry {
        // Walk the graph to compute current stats
        here.member_walker();

        // Retrieve saved stats from the stats_holder
        take --> has_stats;
        if (n = here.outbound_nodes(has_stats).first) {
            total_members = n.total_members;
            paid_today = n.paid_today;
            overdue_members = n.overdue_members;
            total_collected = n.total_collected;
        } else {
             // Fallback if stats_holder not found
             here.member_walker();
        }

        // Return the compiled statistics as a dict (JSON response)
        return {
            "total_members": total_members,
            "paid_today": paid_today,
            "overdue_members": overdue_members,
            "total_collected": total_collected
        };
    }
    
    // Ability to collect all member stats
    walker member_walker {
        root {
            total_members = 0;
            paid_today = 0;
            overdue_members = 0;
            total_collected = 0.0;
        }
        
        node::member {
            total_members += 1;
            if (here.payment_status == "paid") {
                paid_today += 1;
                total_collected += here.amount;
            } elif (here.payment_status == "overdue") {
                overdue_members += 1;
            }
        }
        
        destr {
            // Update the global stats_holder before exiting
            take --> has_stats;
            if (n = here.outbound_nodes(has_stats).first) {
                n.total_members = total_members;
                n.paid_today = paid_today;
                n.overdue_members = overdue_members;
                n.total_collected = total_collected;
            }
        }
    }


    // API 2: /walker/GetOfficers
    ability GetOfficers with entry {
        officers_list = [];
        // Traverse all officer nodes
        travel --> node::officer;
        
        node::officer {
            officers_list.push({
                "id": here.id,
                "name": here.name,
                "location": {"lat": here.lat, "lng": here.lng},
                "members_assigned": here.members_assigned,
                "collections_today": here.collections_today
            });
        }
        // Return list of dictionaries
        return officers_list;
    }


    // API 3: /walker/GetMembers
    ability GetMembers with entry {
        members_list = [];
        travel --> node::member;
        
        node::member {
            members_list.push({
                "id": here.id,
                "name": here.name,
                "amount": here.amount,
                "payment_status": here.payment_status,
                "officer_id": here.officer_id,
                "location": {"lat": here.lat, "lng": here.lng}
            });
        }
        return members_list;
    }


    // API 4: /walker/AnalyzeRiskZones
    ability AnalyzeRiskZones with entry {
        zones_list = [];
        travel --> node::zone;
        
        node::zone {
            zones_list.push({
                "zone_name": here.zone_name,
                "risk_level": here.risk_level,
                "overdue_rate": here.overdue_rate,
                "members_count": here.members_count
            });
        }
        return zones_list; // Returns mock data from initialization
    }


    // API 5: /walker/AddOfficer (data in payload)
    ability AddOfficer with entry {
        // Assuming payload is passed in as 'data' (common JAC pattern)
        id = data["id"];
        name = data["name"];
        lat = data["latitude"];
        lng = data["longitude"];

        // Check if officer already exists
        take --> node::officer(id==id);
        if (here.outbound_nodes().len > 0) {
            return {"status": "error", "message": "Officer ID already exists."};
        }

        // Create new officer node linked to root
        spawn node::officer(id=id, name=name, lat=lat, lng=lng);
        return {"status": "success", "id": id};
    }


    // API 6: /walker/AddMember (data in payload)
    ability AddMember with entry {
        id = data["id"];
        name = data["name"];
        lat = data["latitude"];
        lng = data["longitude"];
        amount = data["amount"];
        payment_status = data["payment_status"];
        officer_id = data["officer_id"] or 0;

        // Check if member already exists
        take --> node::member(id==id);
        if (here.outbound_nodes().len > 0) {
            return {"status": "error", "message": "Member ID already exists."};
        }

        // Create new member node linked to root
        spawn node::member(
            id=id, 
            name=name, 
            lat=lat, 
            lng=lng, 
            amount=amount, 
            payment_status=payment_status, 
            officer_id=officer_id
        );
        return {"status": "success", "id": id};
    }


    // API 7: /walker/AssignMembersToOfficers (data in payload)
    ability AssignMembersToOfficers with entry {
        radius_km = data["radius_km"];

        // In a real application, you would implement geospatial logic here.
        // For JAC, we mock a successful assignment.
        
        // Example: Randomly assign all unassigned members (officer_id=0) to Officer 1
        count = 0;
        travel --> node::member(officer_id==0);
        node::member {
            here.officer_id = 1; // Assign to Officer 1
            count += 1;
        }

        return {"status": "success", "assigned_count": count, "radius_used": radius_km};
    }


    // API 8: /walker/OptimizeRoute (data in payload)
    ability OptimizeRoute with entry {
        officer_id = data["officer_id"];

        // Mocking a route for the first 5 members assigned to this officer
        mock_route = [
            {"member": {"name": "David Mwangi"}, "distance_km": 0.5},
            {"member": {"name": "Grace Wanjiku"}, "distance_km": 0.3},
            {"member": {"name": "Sarah Akinyi"}, "distance_km": 0.8},
        ];

        return {
            "total_members": 3,
            "total_distance_km": 1.6,
            "estimated_time_hours": 0.5,
            "route": mock_route
        };
    }


    // API 9: /walker/GenerateAISummary
    ability GenerateAISummary with entry {
        // Mocking the AI summary logic
        ai_summary = "The Q3 data shows a significant increase in collection efficiency in zones assigned to Officer John Kamau (ID: 1). However, the High Risk Zone 'Kibera Zone A' requires immediate intervention. Recommend assigning an additional officer or increasing visit frequency by 50% in the next two weeks to mitigate overdue accounts.";
        
        return {"summary": ai_summary};
    }


    // API 10: /walker/RecordPayment (data in payload)
    ability RecordPayment with entry {
        member_id = data["member_id"];
        amount = data["amount"];
        officer_id = data["officer_id"];

        // Find the member and update their status
        take --> node::member(id==member_id);
        if (m = here.outbound_nodes().first) {
            m.payment_status = "paid";
            
            // Update the officer's collection stats
            take --> node::officer(id==officer_id);
            if (o = here.outbound_nodes().first) {
                o.collections_today += 1;
            }
            return {"status": "success", "message": "Payment recorded and officer stats updated."};
        } else {
            return {"status": "error", "message": "Member not found."};
        }
    }
}