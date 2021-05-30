# Meet in Space
Spatial audio for Jitsi Meet. 

A master's thesis completing during the Music, Communication and Technology program at the University of Oslo (UiO) and University of Science and Technology (NTNU).

A demo video of the system can be found [here](https://vimeo.com/548286337). The system is built upon Jitsi Meet build [2.0.5870](https://github.com/jitsi/jitsi-meet/releases/tag/stable%2Fjitsi-meet_5870).

![Preview of video](preview.gif)

Intructions for an installation of the system are similar to deploying Jitsi Meet as a developer. Instructions were simplifyed from the great guide by corby found [here](https://community.jitsi.org/t/how-to-how-to-build-jitsi-meet-from-source-a-developers-guide/75422).

# Installation

## 1. Install Jitsi Meet 👋

Follow the steps for the official installation [here](https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-quickstart).

❗ Confirm you can join meetings between 3 people (or browser tabs) using your server. If this doesn’t work properly, troubleshoot before continuing.

## 2. Install npm and Node.js 🧪

Download and install the latest LTS versions of npm and Node.js:

```
sudo apt install curl && sudo apt install make
curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify versions of Node.js >= 14 and npm >= 6:

`node -v && npm -v`

Expected output:

```
v14.17.0
6.14.13
```

## 3. Clone this repo via git, update, and install 🤖

⚠️ Do **not** run build commands as the root user but as a normal user (no sudo).

```
cd ~
git clone https://github.com/jacksongoode/meet-in-space.git
cd ~/meet-in-space/
npm update && npm install
```

This guide assumes the cloned folder will appear in the user's `home` directory.

## 4. Configure nginx to use your local folder 📂

Edit your nginx conf file:
`sudo nano /etc/nginx/sites-available/meet.domain.com.conf`

It should look something like this (here, the username is ubuntu):

```
server
{
    listen meet.domain.com:443 ssl http2;
    server_name meet.domain.com;
    ...
    ssl_certificate /etc/ssl/meet.domain.com.crt;
    ssl_certificate_key /etc/ssl/meet.domain.com.key;

    # Comment the next line out, so you can revert later, if needed
    #root /usr/share/jitsi-meet;
    
    # Add this new line below
    root /home/ubuntu/jitsi-meet;
...
}
```

❗ Make sure you review your entire conf file and replace any other relevant occurrences of `/usr/share/jitsi-meet` with `/home/ubuntu/jitsi-meet`.

## 5. Restart nginx and verify 🎊

Restart nginx:
`sudo service nginx restart`

Open a new meeting across a few tabs to verify the page loads and connects.

