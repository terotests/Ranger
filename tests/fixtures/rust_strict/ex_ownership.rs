// Ownership, borrowing and Clone.
//
// A value has one owner; `&` borrows it for reading and `&mut` for changing
// it. Ranger checks the same rules rustc does: uncomment the line marked
// "error" in `main` and the program is refused with the reason.

#[derive(Debug, Clone)]
struct Account {
    owner: String,
    balance: i64,
    history: Vec<i64>,
}

impl Account {
    fn new(owner: &str) -> Account {
        Account { owner: owner.to_string(), balance: 0, history: Vec::new() }
    }

    fn deposit(&mut self, amount: i64) {
        self.balance += amount;
        self.history.push(amount);
    }

    fn withdraw(&mut self, amount: i64) -> Result<(), String> {
        if amount > self.balance {
            return Err(format!("{} cannot withdraw {} (balance {})", self.owner, amount, self.balance));
        }
        self.balance -= amount;
        self.history.push(-amount);
        Ok(())
    }

    fn summary(&self) -> String {
        format!("{}: {} after {} moves", self.owner, self.balance, self.history.len())
    }
}

fn transfer(from: &mut Account, to: &mut Account, amount: i64) -> Result<(), String> {
    from.withdraw(amount)?;
    to.deposit(amount);
    Ok(())
}

fn total(accounts: &[Account]) -> i64 {
    accounts.iter().map(|a| a.balance).sum()
}

fn close(account: Account) -> String {
    format!("closed {} with {}", account.owner, account.balance)
}

fn main() {
    let mut alice = Account::new("alice");
    let mut bob = Account::new("bob");
    alice.deposit(100);
    bob.deposit(20);

    if let Err(e) = transfer(&mut alice, &mut bob, 30) {
        println!("{}", e);
    }
    if let Err(e) = transfer(&mut bob, &mut alice, 80) {
        println!("{}", e);
    }

    let snapshot = alice.clone();
    alice.deposit(5);
    println!("{}", snapshot.summary());
    println!("{}", alice.summary());
    println!("{}", bob.summary());

    let accounts = vec![alice, bob];
    println!("total {}", total(&accounts));

    let mut accounts = accounts;
    let last = accounts.pop().unwrap();
    println!("{}", close(last));
    // error: `last` was moved into `close` above
    // println!("{}", last.summary());
    println!("{} left", accounts.len());
}
