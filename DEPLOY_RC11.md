# Deploy DataTalk Frontend RC11

1. Deploy Backend RC11 first and verify `/health` = `2.2.0-rc.11`.
2. Upload this package to the DataTalk dashboard repository/branch used by Vercel.
3. Verify `package.json` name is `datatalk-dashboard` and version is `2.2.0-rc.11`.
4. Wait for Vercel Preview to become Ready.
5. Verify: new DataTalk logo/name, Today selected by default, Session Journey shows Vietnam time.

No database migration is required.
