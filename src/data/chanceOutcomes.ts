export interface ChanceOutcome {
  id: string;
  type: 'good' | 'bad';
  name: string;
  description: string;
  action: 'receive' | 'pay' | 'receive_per_player' | 'pay_per_player' | 'receive_property_upgrade' | 'pay_property_repair' | 'tax_audit' | 'rent_reimbursement' | 'lucky_investment';
}

export const CHANCE_OUTCOMES: ChanceOutcome[] = [
  // GOOD OUTCOMES (8)
  {
    id: 'unexpected-sponsorship',
    type: 'good',
    name: 'Unexpected Sponsorship',
    description: 'Receive 200M from the bank.',
    action: 'receive',
  },
  {
    id: 'viral-attraction',
    type: 'good',
    name: 'Viral Attraction',
    description: 'Receive 300M from the bank.',
    action: 'receive',
  },
  {
    id: 'tech-grant',
    type: 'good',
    name: 'Tech Grant Awarded',
    description: 'Receive 400M from the bank.',
    action: 'receive',
  },
  {
    id: 'property-upgrade',
    type: 'good',
    name: 'Property Upgrade Buzz',
    description: 'Choose any one property you own. Collect 150M from each other player.',
    action: 'receive_property_upgrade',
  },
  {
    id: 'hidden-revenue',
    type: 'good',
    name: 'Found Hidden Revenue Stream',
    description: 'Receive 500M from the bank.',
    action: 'receive',
  },
  {
    id: 'celebrity-endorsement',
    type: 'good',
    name: 'Celebrity Endorsement',
    description: 'Receive 250M from the bank.',
    action: 'receive',
  },
  {
    id: 'lucky-investment',
    type: 'good',
    name: 'Lucky Investment Flip',
    description: 'Receive 100M now and an additional 100M at your next turn start (manual reminder).',
    action: 'lucky_investment',
  },
  {
    id: 'rent-reimbursement',
    type: 'good',
    name: 'Rent Reimbursement',
    description: 'Take back the last rent you paid (manual amount entry).',
    action: 'rent_reimbursement',
  },
  // BAD OUTCOMES (8)
  {
    id: 'maintenance-failure',
    type: 'bad',
    name: 'Maintenance Failure',
    description: 'Pay 150M to the bank.',
    action: 'pay',
  },
  {
    id: 'property-damage',
    type: 'bad',
    name: 'Property Damage',
    description: 'Pay 200M to the bank.',
    action: 'pay',
  },
  {
    id: 'legal-dispute',
    type: 'bad',
    name: 'Legal Dispute',
    description: 'Pay 100M to each other player.',
    action: 'pay_per_player',
  },
  {
    id: 'failed-expansion',
    type: 'bad',
    name: 'Failed Expansion',
    description: 'Pay 300M to the bank.',
    action: 'pay',
  },
  {
    id: 'security-breach',
    type: 'bad',
    name: 'Security Breach',
    description: 'Choose one property you own. Pay 150M to the bank for repairs.',
    action: 'pay_property_repair',
  },
  {
    id: 'tax-audit',
    type: 'bad',
    name: 'Tax Audit',
    description: 'Pay 10% of your current cash (manual calculation).',
    action: 'tax_audit',
  },
  {
    id: 'bad-publicity',
    type: 'bad',
    name: 'Bad Publicity',
    description: 'Pay 250M to the bank.',
    action: 'pay',
  },
  {
    id: 'forced-donation',
    type: 'bad',
    name: 'Forced Donation',
    description: 'Pay 50M to each other player.',
    action: 'pay_per_player',
  },
];

export const CHANCE_AMOUNTS: Record<string, number> = {
  'unexpected-sponsorship': 200,
  'viral-attraction': 300,
  'tech-grant': 400,
  'property-upgrade': 150, // per player
  'hidden-revenue': 500,
  'celebrity-endorsement': 250,
  'lucky-investment': 100,
  'rent-reimbursement': 0, // manual
  'maintenance-failure': 150,
  'property-damage': 200,
  'legal-dispute': 100, // per player
  'failed-expansion': 300,
  'security-breach': 150,
  'tax-audit': 0, // 10% of cash
  'bad-publicity': 250,
  'forced-donation': 50, // per player
};
