import 'package:flutter/material.dart';
import 'package:monopoly_banking/core/models/transaction.dart';

class TransactionLogScreen extends StatelessWidget {
  final List<Transaction> transactions;

  const TransactionLogScreen({
    super.key,
    required this.transactions,
  });

  String _formatTransactionType(TransactionType type) {
    switch (type) {
      case TransactionType.addMoney:
        return 'Add Money';
      case TransactionType.transfer:
        return 'Transfer';
      case TransactionType.propertyPurchase:
        return 'Property Purchase';
      case TransactionType.propertySale:
        return 'Property Sale';
      case TransactionType.rent:
        return 'Rent';
      case TransactionType.cardEffect:
        return 'Card Effect';
      case TransactionType.tax:
        return 'Tax';
    }
  }

  String _formatTransaction(Transaction transaction) {
    switch (transaction.type) {
      case TransactionType.addMoney:
        return 'Added \$${transaction.amount}';
      case TransactionType.transfer:
        return 'Transferred \$${transaction.amount}';
      case TransactionType.propertyPurchase:
        return 'Purchased property for \$${transaction.amount}';
      case TransactionType.propertySale:
        return 'Sold property for \$${transaction.amount}';
      case TransactionType.rent:
        return 'Paid \$${transaction.amount} rent';
      case TransactionType.cardEffect:
        return 'Card effect';
      case TransactionType.tax:
        return 'Paid \$${transaction.amount} tax';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Transaction Log'),
      ),
      body: transactions.isEmpty
          ? const Center(child: Text('No transactions yet'))
          : ListView.builder(
              itemCount: transactions.length,
              itemBuilder: (context, index) {
                final transaction = transactions[transactions.length - 1 - index]; // Reverse order
                return Card(
                  margin: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  child: ListTile(
                    title: Text(_formatTransactionType(transaction.type)),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(_formatTransaction(transaction)),
                        const SizedBox(height: 4),
                        Text(
                          _formatTimestamp(transaction.timestamp),
                          style: const TextStyle(fontSize: 12),
                        ),
                      ],
                    ),
                    trailing: transaction.amount > 0
                        ? Text(
                            '\$${transaction.amount}',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                            ),
                          )
                        : null,
                  ),
                );
              },
            ),
    );
  }

  String _formatTimestamp(DateTime timestamp) {
    return '${timestamp.year}-${timestamp.month.toString().padLeft(2, '0')}-${timestamp.day.toString().padLeft(2, '0')} '
        '${timestamp.hour.toString().padLeft(2, '0')}:${timestamp.minute.toString().padLeft(2, '0')}';
  }
}

