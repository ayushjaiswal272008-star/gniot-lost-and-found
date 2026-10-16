import { CampusLocation } from '../types';

export const INITIAL_CAMPUS_LOCATIONS: CampusLocation[] = [
  {
    id: 'loc-1',
    name: 'Main Academic Block (APJ Kalam Block)',
    code: 'MAB',
    zone: 'Academic',
    description: 'Central administrative offices, lecture halls 101-315, and dean office',
    deskContact: 'Ground Floor Reception Desk (+91 120 232xxxx)'
  },
  {
    id: 'loc-2',
    name: 'GNIOT Central Library',
    code: 'LIB',
    zone: 'Academic',
    description: 'Floors 1-3, Reference section, Reading hall, Digital library',
    deskContact: 'Circulation Desk Counter 2'
  },
  {
    id: 'loc-3',
    name: 'GNIOT Campus Central Canteen & Nescafe',
    code: 'CAN',
    zone: 'Dining',
    description: 'Student cafeteria, outdoor patio, Nescafe kiosk',
    deskContact: 'Canteen Supervisor Counter'
  },
  {
    id: 'loc-4',
    name: 'Computer Science & AI Tech Labs (Block B)',
    code: 'CS-LAB',
    zone: 'Academic',
    description: 'High-performance computing labs, AI/ML center, Robotics lab',
    deskContact: 'Lab Technician Office, Lab 204'
  },
  {
    id: 'loc-5',
    name: 'Mechanical & Civil Engineering Workshops',
    code: 'MECH-WS',
    zone: 'Academic',
    description: 'Foundry, CNC lab, drafting rooms, heavy machines bay',
    deskContact: 'Workshop Superintendent Cabin'
  },
  {
    id: 'loc-6',
    name: 'Auditorium & Seminar Hall Complex',
    code: 'AUD',
    zone: 'Administrative',
    description: '800-seater main auditorium, conference room 1 & 2',
    deskContact: 'Event Management Office'
  },
  {
    id: 'loc-7',
    name: 'Boys Hostel Complex (Sarojini & Raman)',
    code: 'BH-1',
    zone: 'Residential',
    description: 'Rooms, common mess, badminton court, reading room',
    deskContact: 'Chief Warden Office, Gate 1'
  },
  {
    id: 'loc-8',
    name: 'Girls Hostel Complex (Kalpana Chawla Block)',
    code: 'GH-1',
    zone: 'Residential',
    description: 'Residential wings, recreation lounge, mess hall',
    deskContact: 'Warden Desk, Main Entry Gate'
  },
  {
    id: 'loc-9',
    name: 'Sports Complex & Cricket Ground',
    code: 'SPT',
    zone: 'Sports',
    description: 'Cricket pavilion, basketball courts, gym, synthetic running track',
    deskContact: 'Sports Officer Room, Pavilion'
  },
  {
    id: 'loc-10',
    name: 'Main Campus Security Gate 1 (Knowledge Park II)',
    code: 'GATE-1',
    zone: 'Administrative',
    description: 'Primary security checkpoint, visitor registration, 24/7 lost property desk',
    deskContact: 'Head Security Officer Cell'
  }
];
