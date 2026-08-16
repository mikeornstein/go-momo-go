import "CoreLibs/graphics"
import "CoreLibs/ui"
import "CoreLibs/timer"
import "walk/walk_scene"

local pd <const> = playdate

pd.display.setRefreshRate(30)

local scene = WalkScene.new()

function playdate.update()
    scene:update()
    scene:draw()
    pd.timer.updateTimers()
end
