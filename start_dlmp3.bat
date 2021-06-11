pushd %~dp0
set NVM_VERS=16.3.0
set PYTHONPATH=%~dp0\py3-noinstall
set NVM_HOME=%~dp0\nvm-noinstall\
set NVM_SYMLINK=%~dp0\nodejs\
set PATH=%PATH%;%~dp0\py3-noinstall;%NVM_HOME%;%NVM_HOME%\v%NVM_VERS%
::nvm use 16.3.0 <- we skip this as it would require admin rights; PATH has 16.3.0 hardcoded
node bot.js

popd