#!/usr/bin/env python3
"""
POIDH CLI - Lightweight command-line interface for headless/server deployment
"""

import sys
import os
import json
import subprocess
import argparse
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv, set_key


class POIDHCLI:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.env_file = self.project_root / '.env'
        load_dotenv(self.env_file)
    
    def wallet_create(self):
        """Create new wallet"""
        print("🔑 Generating new wallet...")
        try:
            result = subprocess.run(
                "npm run wallet:create",
                cwd=str(self.project_root),
                capture_output=True,
                text=True,
                timeout=15
            )
            print(result.stdout)
            if result.returncode == 0:
                print("✅ Wallet created and saved to .env")
            else:
                print(f"❌ Error: {result.stderr}")
                return 1
        except Exception as e:
            print(f"❌ Error: {e}")
            return 1
        return 0
    
    def wallet_balance(self):
        """Check wallet balance"""
        print("💰 Checking balance...")
        try:
            result = subprocess.run(
                "npm run wallet:balance",
                cwd=str(self.project_root),
                capture_output=True,
                text=True,
                timeout=10
            )
            print(result.stdout)
        except Exception as e:
            print(f"❌ Error: {e}")
            return 1
        return 0
    
    def config_show(self):
        """Show current configuration"""
        print("⚙️  Current Configuration:")
        print("─" * 50)
        
        config_keys = [
            'CHAIN_ID',
            'BOT_PRIVATE_KEY',
            'BASE_RPC_URL',
            'OPENAI_API_KEY',
            'POLLING_INTERVAL',
            'MAX_GAS_PRICE_GWEI',
            'AUTO_APPROVE_GAS'
        ]
        
        for key in config_keys:
            value = os.getenv(key, '(not set)')
            if 'KEY' in key or 'PRIVATE' in key:
                value = value[:4] + '...' if value != '(not set)' else value
            print(f"{key:25} {value}")
        
        return 0
    
    def config_set(self, key: str, value: str):
        """Set configuration value"""
        try:
            set_key(str(self.env_file), key, value)
            print(f"✅ {key} = {value}")
        except Exception as e:
            print(f"❌ Error: {e}")
            return 1
        return 0
    
    def bounty_list(self):
        """List available bounties"""
        bounties = {
            'proveOutside': '🌳 Prove You\'re Outside Right Now',
            'handwrittenDate': '📝 Handwritten Date Challenge',
            'mealPhoto': '🍽️  Show Your Current Meal',
            'objectTower': '🗼 Creative Object Tower Challenge',
            'shadowArt': '🌗 Creative Shadow Photography',
            'animalPhoto': '🐾 Best Animal Photo',
        }
        
        print("📋 Available Bounties:")
        print("─" * 50)
        
        for cmd, name in bounties.items():
            print(f"{cmd:18} {name}")
        
        return 0
    
    def bounty_launch(self, bounty_type: str, reward: float = None):
        """Launch a bounty"""
        cmd = f"npm run agent {bounty_type}"
        if reward:
            cmd += f" -- --reward {reward}"
        
        print(f"🚀 Launching: {cmd}")
        print("─" * 50)
        
        try:
            result = subprocess.run(
                cmd,
                cwd=str(self.project_root),
                shell=True,
                timeout=600  # 10 min timeout
            )
            return result.returncode
        except subprocess.TimeoutExpired:
            print("⏱️  Timeout")
            return 1
        except Exception as e:
            print(f"❌ Error: {e}")
            return 1
    
    def bounty_monitor(self):
        """Monitor bounties"""
        print("🔍 Monitoring bounties...")
        
        try:
            result = subprocess.run(
                "npm run agent monitor",
                cwd=str(self.project_root),
                shell=True
            )
            return result.returncode
        except Exception as e:
            print(f"❌ Error: {e}")
            return 1
    
    def audit_show(self, limit: int = 20):
        """Show audit trail"""
        audit_file = self.project_root / 'logs' / 'audit-trail.json'
        
        if not audit_file.exists():
            print("❌ No audit trail found")
            return 1
        
        try:
            with open(audit_file) as f:
                data = json.load(f)
            
            print("📋 Audit Trail (Last {} entries):".format(limit))
            print("─" * 80)
            
            entries = data.get('entries', [])[-limit:]
            for entry in entries:
                ts = entry.get('timestamp', '?')[:19]
                action = entry.get('action', '?')
                print(f"[{ts}] {action}")
            
            return 0
        except Exception as e:
            print(f"❌ Error: {e}")
            return 1
    
    def health_check(self):
        """Check system health"""
        print("🏥 Health Check:")
        print("─" * 50)
        
        checks = {
            'Wallet': self._check_wallet,
            'Node.js': self._check_nodejs,
            'npm': self._check_npm,
            'RPC Connection': self._check_rpc,
        }
        
        for check_name, check_fn in checks.items():
            status = "✅" if check_fn() else "❌"
            print(f"{status} {check_name}")
        
        return 0
    
    def _check_wallet(self) -> bool:
        pk = os.getenv('BOT_PRIVATE_KEY')
        return bool(pk and pk != '0x')
    
    def _check_nodejs(self) -> bool:
        try:
            result = subprocess.run(
                "node --version",
                capture_output=True,
                timeout=5,
                shell=True
            )
            return result.returncode == 0
        except:
            return False
    
    def _check_npm(self) -> bool:
        try:
            result = subprocess.run(
                "npm --version",
                capture_output=True,
                timeout=5,
                shell=True
            )
            return result.returncode == 0
        except:
            return False
    
    def _check_rpc(self) -> bool:
        try:
            rpc_url = os.getenv('BASE_RPC_URL')
            if not rpc_url:
                return False
            
            import requests
            resp = requests.post(
                rpc_url,
                json={'jsonrpc': '2.0', 'method': 'eth_chainId', 'params': [], 'id': 1},
                timeout=5
            )
            return resp.status_code == 200
        except:
            return False


def main():
    parser = argparse.ArgumentParser(
        description='POIDH Autonomous Bounty Bot - CLI Control',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s wallet create           # Generate new wallet
  %(prog)s wallet balance          # Check balance
  %(prog)s config show             # Show configuration
  %(prog)s config set CHAIN_ID 8453
  %(prog)s bounty list             # List available bounties
  %(prog)s bounty launch proveOutside  # Launch bounty
  %(prog)s bounty launch proveOutside --reward 0.01
  %(prog)s bounty monitor          # Monitor active bounties
  %(prog)s audit show              # Show audit trail
  %(prog)s health                  # System health check
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # Wallet commands
    wallet_parser = subparsers.add_parser('wallet', help='Wallet management')
    wallet_sub = wallet_parser.add_subparsers(dest='wallet_cmd')
    wallet_sub.add_parser('create', help='Generate new wallet')
    wallet_sub.add_parser('balance', help='Check balance')
    
    # Config commands
    config_parser = subparsers.add_parser('config', help='Configuration')
    config_sub = config_parser.add_subparsers(dest='config_cmd')
    config_sub.add_parser('show', help='Show configuration')
    set_parser = config_sub.add_parser('set', help='Set configuration value')
    set_parser.add_argument('key')
    set_parser.add_argument('value')
    
    # Bounty commands
    bounty_parser = subparsers.add_parser('bounty', help='Bounty management')
    bounty_sub = bounty_parser.add_subparsers(dest='bounty_cmd')
    bounty_sub.add_parser('list', help='List bounties')
    launch_parser = bounty_sub.add_parser('launch', help='Launch bounty')
    launch_parser.add_argument('bounty_type')
    launch_parser.add_argument('--reward', type=float, help='Custom reward')
    bounty_sub.add_parser('monitor', help='Monitor bounties')
    
    # Audit commands
    audit_parser = subparsers.add_parser('audit', help='Audit trail')
    audit_sub = audit_parser.add_subparsers(dest='audit_cmd')
    show_parser = audit_sub.add_parser('show', help='Show audit trail')
    show_parser.add_argument('--limit', type=int, default=20, help='Limit entries')
    
    # Health check
    subparsers.add_parser('health', help='System health check')
    
    args = parser.parse_args()
    
    project_root = Path(__file__).parent.parent
    cli = POIDHCLI(str(project_root))
    
    # Route commands
    if not args.command:
        parser.print_help()
        return 0
    
    if args.command == 'wallet':
        if args.wallet_cmd == 'create':
            return cli.wallet_create()
        elif args.wallet_cmd == 'balance':
            return cli.wallet_balance()
    
    elif args.command == 'config':
        if args.config_cmd == 'show':
            return cli.config_show()
        elif args.config_cmd == 'set':
            return cli.config_set(args.key, args.value)
    
    elif args.command == 'bounty':
        if args.bounty_cmd == 'list':
            return cli.bounty_list()
        elif args.bounty_cmd == 'launch':
            return cli.bounty_launch(args.bounty_type, args.reward)
        elif args.bounty_cmd == 'monitor':
            return cli.bounty_monitor()
    
    elif args.command == 'audit':
        if args.audit_cmd == 'show':
            return cli.audit_show(args.limit)
    
    elif args.command == 'health':
        return cli.health_check()
    
    return 0


if __name__ == '__main__':
    sys.exit(main())
