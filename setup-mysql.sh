#!/bin/bash

# MySQL Setup Script for Trip Planner
# This script installs MySQL, creates database, user, and sets up the application
# Run with: sudo bash setup-mysql.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="trip_planner"
DB_USER="trip_planner_user"
DB_HOST="localhost"
DB_PORT="3306"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Trip Planner - MySQL Database Setup Script          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}⚠️  This script needs sudo privileges.${NC}"
    echo -e "${YELLOW}   Please run: sudo bash setup-mysql.sh${NC}"
    exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    OS_VERSION=$VERSION_ID
else
    echo -e "${RED}❌ Cannot detect OS. Exiting.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Detected OS: $OS $OS_VERSION${NC}"
echo ""

# Function to check if MySQL is installed
check_mysql_installed() {
    if command -v mysql &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to install MySQL
install_mysql() {
    echo -e "${BLUE}📦 Installing MySQL...${NC}"
    
    if [ "$OS" == "ubuntu" ] || [ "$OS" == "debian" ]; then
        apt update
        DEBIAN_FRONTEND=noninteractive apt install -y mysql-server
        systemctl start mysql
        systemctl enable mysql
    elif [ "$OS" == "centos" ] || [ "$OS" == "rhel" ] || [ "$OS" == "fedora" ]; then
        if [ "$OS" == "fedora" ]; then
            dnf install -y mysql-server
        else
            yum install -y mysql-server
        fi
        systemctl start mysqld
        systemctl enable mysqld
    else
        echo -e "${RED}❌ Unsupported OS: $OS${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ MySQL installed successfully${NC}"
}

# Function to secure MySQL installation
secure_mysql() {
    echo -e "${BLUE}🔒 Securing MySQL installation...${NC}"
    
    # Get MySQL root password or set one
    if [ -z "$MYSQL_ROOT_PASSWORD" ]; then
        echo -e "${YELLOW}Enter MySQL root password (or press Enter to skip secure installation):${NC}"
        read -s MYSQL_ROOT_PASSWORD
        echo ""
    fi
    
    # For Ubuntu/Debian, MySQL 5.7+ uses auth_socket by default
    # We'll create a script to set root password if needed
    if [ -n "$MYSQL_ROOT_PASSWORD" ]; then
        mysql -u root <<EOF
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$MYSQL_ROOT_PASSWORD';
FLUSH PRIVILEGES;
EOF
        echo -e "${GREEN}✓ MySQL root password set${NC}"
    fi
}

# Function to create database and user
create_database() {
    echo -e "${BLUE}🗄️  Creating database and user...${NC}"
    
    # Prompt for database user password
    if [ -z "$DB_PASSWORD" ]; then
        echo -e "${YELLOW}Enter password for database user '$DB_USER':${NC}"
        read -s DB_PASSWORD
        echo ""
        echo -e "${YELLOW}Confirm password:${NC}"
        read -s DB_PASSWORD_CONFIRM
        echo ""
        
        if [ "$DB_PASSWORD" != "$DB_PASSWORD_CONFIRM" ]; then
            echo -e "${RED}❌ Passwords don't match. Exiting.${NC}"
            exit 1
        fi
    fi
    
    # Check if we need root password
    MYSQL_CMD="mysql"
    if [ -n "$MYSQL_ROOT_PASSWORD" ]; then
        MYSQL_CMD="mysql -u root -p$MYSQL_ROOT_PASSWORD"
    else
        # Try without password (Ubuntu/Debian default)
        MYSQL_CMD="sudo mysql"
    fi
    
    # Create database and user
    $MYSQL_CMD <<EOF
-- Create database
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER IF NOT EXISTS '$DB_USER'@'$DB_HOST' IDENTIFIED BY '$DB_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'$DB_HOST';

-- Flush privileges
FLUSH PRIVILEGES;

-- Show success
SELECT 'Database and user created successfully!' AS Status;
EOF

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Database '$DB_NAME' created${NC}"
        echo -e "${GREEN}✓ User '$DB_USER' created${NC}"
    else
        echo -e "${RED}❌ Failed to create database/user${NC}"
        exit 1
    fi
}

# Function to test connection
test_connection() {
    echo -e "${BLUE}🔌 Testing database connection...${NC}"
    
    if [ -n "$DB_PASSWORD" ]; then
        mysql -u "$DB_USER" -p"$DB_PASSWORD" -h "$DB_HOST" -e "USE $DB_NAME; SELECT 'Connection successful!' AS Status;" > /dev/null 2>&1
    else
        echo -e "${YELLOW}⚠️  Cannot test connection without password${NC}"
        return 0
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Database connection successful${NC}"
    else
        echo -e "${YELLOW}⚠️  Connection test failed, but continuing...${NC}"
    fi
}

# Function to create .env file
create_env_file() {
    echo -e "${BLUE}📝 Creating .env file...${NC}"
    
    ENV_FILE=".env"
    if [ -f "$ENV_FILE" ]; then
        echo -e "${YELLOW}⚠️  .env file already exists${NC}"
        read -p "Do you want to overwrite it? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}Skipping .env file creation${NC}"
            return
        fi
    fi
    
    # Build connection string
    if [ -n "$DB_PASSWORD" ]; then
        # URL encode password (basic encoding)
        ENCODED_PASSWORD=$(echo -n "$DB_PASSWORD" | sed 's/:/%3A/g; s/@/%40/g; s/\//%2F/g; s/?/%3F/g; s/#/%23/g; s/\[/%5B/g; s/\]/%5D/g')
        DATABASE_URL="mysql://$DB_USER:$ENCODED_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?schema=public"
    else
        DATABASE_URL="mysql://$DB_USER:YOUR_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?schema=public"
    fi
    
    cat > "$ENV_FILE" <<EOF
# Database Configuration
DATABASE_URL="$DATABASE_URL"

# Application Environment
NODE_ENV=production

# TripAdvisor API
TRIPADVISOR_API_KEY=4BD8D2DC82B84E01965E1180DBADE6EC
EOF

    chmod 600 "$ENV_FILE"
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}⚠️  Remember to keep your .env file secure!${NC}"
}

# Function to setup firewall
setup_firewall() {
    echo -e "${BLUE}🔥 Configuring firewall...${NC}"
    
    if command -v ufw &> /dev/null; then
        ufw allow 3306/tcp comment 'MySQL' 2>/dev/null || true
        echo -e "${GREEN}✓ UFW firewall configured${NC}"
    elif command -v firewall-cmd &> /dev/null; then
        firewall-cmd --permanent --add-port=3306/tcp 2>/dev/null || true
        firewall-cmd --reload 2>/dev/null || true
        echo -e "${GREEN}✓ Firewalld configured${NC}"
    else
        echo -e "${YELLOW}⚠️  No firewall detected, skipping${NC}"
    fi
}

# Function to display summary
display_summary() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              Setup Complete!                           ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}Database Information:${NC}"
    echo -e "  Database Name: ${GREEN}$DB_NAME${NC}"
    echo -e "  Database User: ${GREEN}$DB_USER${NC}"
    echo -e "  Database Host: ${GREEN}$DB_HOST${NC}"
    echo -e "  Database Port: ${GREEN}$DB_PORT${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo -e "  1. ${YELLOW}cd${NC} to your project directory"
    echo -e "  2. Run: ${GREEN}npm install${NC}"
    echo -e "  3. Run: ${GREEN}npx prisma generate${NC}"
    echo -e "  4. Run: ${GREEN}npx prisma db push${NC}"
    echo -e "  5. (Optional) Run: ${GREEN}npx prisma db seed${NC}"
    echo ""
    echo -e "${BLUE}Connection String:${NC}"
    if [ -n "$DB_PASSWORD" ]; then
        ENCODED_PASSWORD=$(echo -n "$DB_PASSWORD" | sed 's/:/%3A/g; s/@/%40/g; s/\//%2F/g; s/?/%3F/g; s/#/%23/g; s/\[/%5B/g; s/\]/%5D/g')
        echo -e "  ${GREEN}mysql://$DB_USER:****@$DB_HOST:$DB_PORT/$DB_NAME?schema=public${NC}"
    else
        echo -e "  ${GREEN}mysql://$DB_USER:YOUR_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?schema=public${NC}"
    fi
    echo ""
    echo -e "${YELLOW}⚠️  Important:${NC}"
    echo -e "  - Keep your database password secure"
    echo -e "  - The .env file contains sensitive information"
    echo -e "  - Consider setting up regular database backups"
    echo ""
}

# Main execution
main() {
    # Check if MySQL is already installed
    if check_mysql_installed; then
        echo -e "${GREEN}✓ MySQL is already installed${NC}"
        read -p "Do you want to reinstall MySQL? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_mysql
        fi
    else
        install_mysql
    fi
    
    # Secure MySQL
    secure_mysql
    
    # Create database and user
    create_database
    
    # Test connection
    test_connection
    
    # Create .env file
    create_env_file
    
    # Setup firewall
    setup_firewall
    
    # Display summary
    display_summary
}

# Run main function
main

