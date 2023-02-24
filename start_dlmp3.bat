pushd %~dp0
set NVM_VERS=16.9.0
set PYTHONPATH=%~dp0\py3-noinstall
set NVM_HOME=%~dp0\nvm-noinstall\
set NVM_SYMLINK=%~dp0\nodejs\
set PATH=%PATH%;%~dp0\py3-noinstall;%NVM_HOME%;%NVM_HOME%\v%NVM_VERS%
::nvm use 16.3.0 <- we skip this as it would require admin rights; PATH has 16.3.0 hardcoded
IF EXIST _init_file.txt DEL _init_file.txt
FOR /L %%y IN (0, 1, 100) DO (
    node bot.js && exit 1
)

popd