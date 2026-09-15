export const demoTraffic = [
  {day:'Sep 9', visitors:820, sessions:1010, conversions:52},
  {day:'Sep 10', visitors:910, sessions:1130, conversions:61},
  {day:'Sep 11', visitors:980, sessions:1210, conversions:67},
  {day:'Sep 12', visitors:1120, sessions:1390, conversions:74},
  {day:'Sep 13', visitors:1060, sessions:1305, conversions:70},
  {day:'Sep 14', visitors:1280, sessions:1570, conversions:88},
  {day:'Sep 15', visitors:1430, sessions:1745, conversions:102},
];

export const demoPages = [
  {path:'/', views:8240, users:4920, avg:'01:42', exit:'28%'},
  {path:'/products', views:5620, users:3610, avg:'02:18', exit:'34%'},
  {path:'/about', views:2180, users:1690, avg:'01:26', exit:'41%'},
  {path:'/contact', views:1460, users:1130, avg:'01:58', exit:'52%'},
];

export const demoDevices = [
  {name:'Mobile', value:62}, {name:'Desktop', value:31}, {name:'Tablet', value:7}
];

export const demoCountries = [
  ['Vietnam','8,421','62%'],['Singapore','1,240','9%'],['United States','980','7%'],['Japan','740','5%'],['Australia','520','4%']
];

export const demoSessions = [
  {id:'s_8f29',device:'iPhone 15',location:'Ho Chi Minh City',duration:'03:42',pages:6,events:21,signal:'High intent'},
  {id:'s_72aa',device:'MacBook Pro',location:'Singapore',duration:'06:18',pages:9,events:38,signal:'Converted'},
  {id:'s_19ce',device:'Android',location:'Hanoi',duration:'01:07',pages:2,events:7,signal:'Rage click'},
  {id:'s_44fd',device:'iPad',location:'Da Nang',duration:'02:51',pages:4,events:13,signal:'Exploring'},
  {id:'s_0a18',device:'Windows',location:'Tokyo',duration:'00:48',pages:1,events:4,signal:'Quick exit'},
];

export const demoFunnel = [
  {name:'Landing page', users:10000, rate:100},
  {name:'Viewed product', users:6840, rate:68.4},
  {name:'Started contact', users:2210, rate:22.1},
  {name:'Submitted form', users:742, rate:7.4},
];

export const demoInsights = [
  {severity:'High',title:'Mobile CTA friction',impact:'-18% conversion',confidence:'92%',text:'Rage clicks cluster around the primary CTA on /products between 360–430px widths.',action:'Move CTA above the first content break and increase the hit area.'},
  {severity:'Medium',title:'Contact page drop-off',impact:'52% exit rate',confidence:'87%',text:'Users reach the form but spend only 18 seconds before leaving.',action:'Reduce form fields from 6 to 4 and add inline validation.'},
  {severity:'Low',title:'Navigation discovery',impact:'+11% engagement',confidence:'79%',text:'Visitors who open the secondary navigation view 1.8× more pages.',action:'Test a more visible category entry in the header.'},
];
